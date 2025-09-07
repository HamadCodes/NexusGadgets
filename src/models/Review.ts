import { ObjectId } from 'mongodb';

export interface Review {
  _id?: ObjectId;
  userId: ObjectId | string;
  productId: string;
  orderId: ObjectId | string;
  item: {
    itemId: string;
    color?: {
      name: string;
      hexCode: string;
    };
    storage?: {
      storage: string;
    };
  };
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}