const Order = require("../models/Order");
const Product = require("../models/Product");
const { StatusCodes } = require("http-status-codes");
const {
  BadRequestError,
  NotFoundError,
} = require("../errors");
const { checkPermission } = require("../utils/checkPermission");
const fakeStripeAPI = async ({ amount, currency }) => {
  const clientSecret = "random";
  return { clientSecret, amount };
};
const getAllOrders = async (req, res) => {
  const orders = await Order.find();
  res.status(StatusCodes.OK).json({ orders, nbHits: orders.length });
};
const getSingleOrder = async (req, res) => {
  const {
    userInfo: { userId },
    params: { id: orderId },
  } = req;
  const order = await Order.findOne({ _id: orderId });
  if (!order) throw new NotFoundError(`Không thể tìm thấy sản phẩm với 'id ${orderId}'`);
  checkPermission({ userInfo: req.userInfo, userId: order.createdByUserId });
  res.status(StatusCodes.OK).json({ order });
};
const createOrder = async (req, res) => {
  const {
    body: { items, tax, shippingFee },
    userInfo: { userId },
  } = req;
  if (!items || items.length <= 0)
    throw new BadRequestError("Vui lòng cung cấp ít nhất là 1 sản phẩm!");
  if (!tax || !shippingFee) {
    throw new BadRequestError("Vui lòng cung cấp thuế và phí ship hàng!");
  }
  let subTotal = 0;
  let orderItems = [];
  for (const item of items) {
    const product = await Product.findOne({ _id: item.productId });
    if (!product) {
      throw new NotFoundError(`Không thể tìm thấy sản phẩm với 'id ${item.productId}'`);
    }
    const singleItem = {
      name: product.name,
      price: product.price,
      image: product.image,
      amount: item.amount,
      productId: product._id,
    };
    orderItems = [...orderItems, singleItem];
    subTotal += product.price * item.amount;
  }
  const total = subTotal + tax + shippingFee;
  const paymentIntend = await fakeStripeAPI({ amount: total, currency: "vnd" });
  req.body.total = total;
  req.body.items = [...orderItems];
  req.body.subTotal = subTotal;
  req.body.createdByUserId = userId;
  req.body.clientSecret = paymentIntend.clientSecret;
  const order = await Order.create({ ...req.body });
  res.status(StatusCodes.CREATED).json({ order });
};
const deleteOrder = async (req, res) => {
  const {
    params: { id: orderId },
    userInfo: { userId },
  } = req;
  const order = await Order.findOne({ _id: orderId });
  if (!order) throw new NotFoundError(`Không thể tìm thấy sản phẩm với 'id ${orderId}'`);
  checkPermission({ userInfo: req.userInfo, userId: order.createdByUserId });
  res
    .status(StatusCodes.OK)
    .json({ message: `Xóa đặt hàng với id ${orderId} thành công` });
};
const updateOrder = async (req, res) => {
  const {
    body: { paymentIntendId },
    params: { id: orderId },
  } = req;
  const order = await Order.findOne({ _id: orderId });
  if (!order) throw new NotFoundError(`Không tìm thấy sản phẩm với id ${orderId}`);
  checkPermission({ userInfo: req.userInfo, userId: order.createdByUserId });
  if (!paymentIntendId)
    throw new BadRequestError(`Vui lòng cung cấp paymentIntendId`);
  order.paymentIntendId = paymentIntendId;
  order.status = "paid";
  await order.save();
  res.status(StatusCodes.OK).json({ message: `Cập nhật thành công!` });
};

const getCurrentUserOrders = async (req, res) => {
  const { userId } = req.userInfo;
  const orders = await Order.find({ createdByUserId: userId });
  res.status(StatusCodes.OK).json({ orders, nbHits: orders.length });
};
// entire user [testing]
module.exports = {
  getAllOrders,
  getSingleOrder,
  createOrder,
  deleteOrder,
  updateOrder,
  getCurrentUserOrders,
};
