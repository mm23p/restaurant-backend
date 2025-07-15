import express from 'express';
const router = express.Router();
import { Op, literal} from 'sequelize';
import { authenticate, isAdmin , isAdminOrManager} from '../middleware/auth.js';
import db from '../models/index.js';

const { MenuItem, Order, OrderItem, User, sequelize } = db;


router.get('/my-orders', authenticate, async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { user_id: req.user.id },
            attributes: ['id', 'createdAt', 'total_price', 'status', 'customer_name', 'table'],
            order: [['createdAt', 'DESC']],
        });
               res.json(orders);
    } catch (err) {
        console.error(`Error fetching orders for user ${req.user.id}:`, err);
        res.status(500).json({ error: 'Failed to fetch your orders' });
    }
});



router.post('/', authenticate, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { items, customer_name, table, userId: offlineUserId, offlineId } = req.body;

        const finalUserId = offlineUserId || (req.user && req.user.id);

        if (!finalUserId) {
            throw new Error('User could not be identified for this order.');
        }
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('Order must contain at least one item.');
        }

        let calculatedTotalPrice = 0;

        for (const requestedItem of items) {
            const menuItem = await MenuItem.findByPk(requestedItem.menu_item_id, { transaction });
            if (!menuItem) throw new Error(`Item with ID ${requestedItem.menu_item_id} not found.`);
            if (!menuItem.is_available) throw new Error(`'${menuItem.name}' is currently unavailable.`);

            if (menuItem.track_quantity) {
                if (menuItem.quantity < requestedItem.quantity) {
                    throw new Error(`Not enough stock for '${menuItem.name}'.Only ${menuItem.quantity} left.`);
                }
                menuItem.quantity -= requestedItem.quantity;
                if (menuItem.quantity <= 0) {
                    menuItem.is_available = false;
                }
                await menuItem.save({ transaction });
            }
            calculatedTotalPrice += parseFloat(menuItem.price) * requestedItem.quantity;
        }

        const newOrder = await Order.create({
            user_id: finalUserId,
            total_price: calculatedTotalPrice,
            status: 'completed',
            customer_name: customer_name,
            table: table,
        }, { transaction });

        const orderItemsToCreate = items.map(item => ({
            order_id: newOrder.id,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            price_at_time: item.price,
        }));
        await OrderItem.bulkCreate(orderItemsToCreate, { transaction });

        await transaction.commit();
        
        res.status(201).json({ 
            message: 'Order placed successfully!', 
            orderId: newOrder.id,
            syncedOfflineId: offlineId 
        });

    } catch (err) {
        await transaction.rollback();
        console.error('Order creation failed:', err.message);
        res.status(400).json({ error: err.message });
    }
});

router.get('/', authenticate, isAdminOrManager, async (req, res) => {
    try {
        const { waiter, startDate, endDate } = req.query;

        // --- NEW, MORE EXPLICIT QUERY ---
        const findOptions = {
            // We select all columns from the Order table
            attributes: { 
                include: [
                    // We manually add a new field called 'waiter_name' to the result
                    // by selecting it from the associated 'user' table.
                    [literal('`user`.`full_name`'), 'waiter_name']
                ]
            },
            include: [
                { 
                    model: User, 
                    as: 'user', 
                    attributes: [] // We don't need to select any attributes here anymore
                },
                {
                    model: OrderItem,
                    as: 'items',
                    attributes: ['quantity'],
                    include: { model: MenuItem, attributes: ['name'] }
                }
            ],
            order: [['createdAt', 'DESC']]
        };

        // The filtering logic remains the same
        let whereClause = {};
        if (waiter) {
            // We filter on the associated user's full_name
            whereClause['$user.full_name$'] = { [Op.like]: `%${waiter}%` };
        }
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            whereClause.createdAt = { [Op.between]: [start, end] };
        }
        if (Object.keys(whereClause).length > 0) {
            findOptions.where = whereClause;
        }
        
        const orders = await Order.findAll(findOptions);
        
        // --- NEW MAPPING LOGIC ---
        // We now need to format the response to match what the frontend expects.
        const formattedOrders = orders.map(order => {
            const orderJSON = order.toJSON();
            // The user object might not be fully populated, so we use the 'waiter_name' we selected.
            return {
                ...orderJSON,
                user: {
                    full_name: orderJSON.waiter_name 
                }
            };
        });

        res.json(formattedOrders);
    } catch (err) {
        console.error('Error fetching all orders:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

export default router;