
import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/authMiddleware";

import {
  createSaleService,
  getSalesService,
  getSaleByIdService
} from "../services/salesService";

const getPharmacy = (
  req: AuthRequest,
  res: Response
): string | null => {
  const pharmacyId = req.params.pharmacyId as string;

  if (
    !mongoose.isValidObjectId(pharmacyId) ||
    req.user?.pharmacyId !== pharmacyId
  ) {
    res.status(403).json({
      success: false,
      message: "Unauthorized pharmacy"
    });
    return null;
  }

  return pharmacyId;
};

export const createSale = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const pharmacyId = getPharmacy(req, res);
  if (!pharmacyId) return;

  try {
    const sale = await createSaleService({
      pharmacyId,
      createdBy: req.user!.userId,
      items: req.body.items
    });

    res.status(201).json({
      success: true,
      message: "Draft sale created",
      data: sale
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error
        ? error.message
        : "Unable to create sale"
    });
  }
};

export const getSales = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const pharmacyId = getPharmacy(req, res);
  if (!pharmacyId) return;

  try {
    const sales = await getSalesService(pharmacyId);
    res.json({ success: true, data: sales });
  } catch {
    res.status(500).json({
      success: false,
      message: "Unable to retrieve sales"
    });
  }
};

export const getSaleById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const pharmacyId = getPharmacy(req, res);
  if (!pharmacyId) return;

  try {
    const sale = await getSaleByIdService(
      req.params.id as string,
      pharmacyId
    );

    if (!sale) {
      res.status(404).json({
        success: false,
        message: "Sale not found"
      });
      return;
    }

    res.json({ success: true, data: sale });
  } catch {
    res.status(400).json({
      success: false,
      message: "Invalid sale request"
    });
  }
};

export const completeSale = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  res.status(501).json({
    success: false,
    message: "Sale completion is scheduled for Day 9"
  });
};
