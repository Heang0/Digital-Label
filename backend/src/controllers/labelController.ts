import { Request, Response } from 'express';

export const getLabels = async (req: Request, res: Response) => {
  try {
    // This is a placeholder. Later you would fetch from Firebase.
    const labels = [
      { id: '1', name: 'Premium Coffee', price: 12.99 },
      { id: '2', name: 'Organic Milk', price: 3.99 }
    ];
    res.json(labels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch labels' });
  }
};

export const createLabel = async (req: Request, res: Response) => {
  try {
    const { name, price } = req.body;
    // logic to save to firebase
    res.status(201).json({ message: 'Label created successfully', data: { name, price } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create label' });
  }
};
