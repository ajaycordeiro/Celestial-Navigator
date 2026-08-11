import { Router, type IRouter } from "express";
import healthRouter from "./health";
import skyRouter from "./sky/index.js";
import nasaRouter from "./nasa/index.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(skyRouter);
router.use(nasaRouter);

export default router;
