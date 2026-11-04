import { Request, Response } from 'express';

export const createReturn = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Return creation not yet implemented' });
};

export const getReturns = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Return listing not yet implemented' });
};

export const getReturnById = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Return retrieval not yet implemented' });
};

export const confirmReturn = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Return confirmation not yet implemented' });
};

