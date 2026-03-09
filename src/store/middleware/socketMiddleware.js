/**
 * Socket Middleware — Bridges Redux actions ↔ Socket.IO events
 * Connects socket on login, joins order rooms on order placement
 */
import socketService from '../../services/socketService';
import { setSocketConnected } from '../slices/orderSlice';
import { loginSuccess, logout } from '../slices/authSlice';
import { setActiveOrder } from '../slices/orderSlice';

const socketMiddleware = store => next => action => {
  const result = next(action);

  switch (action.type) {
    case loginSuccess.type:
      // Connect socket on login
      socketService.connect();
      break;

    case logout.type:
      socketService.disconnect();
      break;

    case setActiveOrder.type: {
      // Join the order room when a new order is placed
      const order = action.payload;
      const user = store.getState().auth.user;
      if (order?.id || order?.orderId) {
        socketService.joinOrderRoom(order.orderId ?? order.id, user?.id);
      }
      break;
    }
  }

  return result;
};

export default socketMiddleware;
