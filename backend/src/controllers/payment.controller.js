import prisma from '../config/database.js';

export const createPayment = async (req, res) => {
  try {
    const {
      bookingId,
      tripId,
      amount,
      paymentType,
      gatewayRef,
    } = req.body;

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        tripId,
        amount,
        paymentType,
        gatewayRef,
        status: 'COMPLETED', // Assume payment is successful for now
      },
    });

    // Update booking/trip payment status
    if (bookingId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { 
          advancePayment: paymentType === 'ADVANCE' ? amount : undefined,
          finalAmount: paymentType === 'FULL_PAYMENT' ? amount : undefined,
        },
      });
    }

    if (tripId) {
      await prisma.trip.update({
        where: { id: tripId },
        data: { 
          paidAmount: { increment: amount },
        },
      });
    }

    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getPayments = async (req, res) => {
  try {
    const { bookingId, tripId } = req.query;
    
    const payments = await prisma.payment.findMany({
      where: {
        ...(bookingId && { bookingId }),
        ...(tripId && { tripId }),
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status } = req.body;

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status },
    });

    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const totalAmount = await prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    });

    res.json({
      payments,
      totalRevenue: totalAmount._sum.amount || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};