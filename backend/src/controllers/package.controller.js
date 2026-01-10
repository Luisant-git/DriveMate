import prisma from '../config/database.js';

export const createPackage = async (req, res) => {
  try {
    const { name, type, duration, price, description } = req.body;

    const package = await prisma.package.create({
      data: { name, type, duration, price, description },
    });

    res.status(201).json(package);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getPackages = async (req, res) => {
  try {
    const { type } = req.query;
    
    const packages = await prisma.package.findMany({
      where: {
        isActive: true,
        ...(type && { type }),
      },
    });

    res.json(packages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePackage = async (req, res) => {
  try {
    const { packageId } = req.params;
    const updateData = req.body;

    const package = await prisma.package.update({
      where: { id: packageId },
      data: updateData,
    });

    res.json(package);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deletePackage = async (req, res) => {
  try {
    const { packageId } = req.params;

    await prisma.package.update({
      where: { id: packageId },
      data: { isActive: false },
    });

    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};