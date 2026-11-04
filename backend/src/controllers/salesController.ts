
import { Request, Response } from "express";

// Create a draft sale
export const createSale = async (
  req: Request,
  res: Response
): Promise<void> => {
  res.status(501).json({
    message: "Create sale service not implemented yet"
  });
};

// Get all sales
export const getSales = async (
  req: Request,
  res: Response
): Promise<void> => {
  res.status(501).json({
    message: "Get sales service not implemented yet"
  });
};

// Get a sale by ID
export const getSaleById = async (
  req: Request,
  res: Response
): Promise<void> => {
  res.status(501).json({
    message: "Get sale by ID not implemented yet"
  });
};

// Complete a sale
export const completeSale = async (
  req: Request,
  res: Response
): Promise<void> => {
  res.status(501).json({
    message: "Complete sale service not implemented yet"
  });
};
