import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function test() {
  console.log(cloudinary.config());

  try {
    const result = await cloudinary.api.ping();
    console.log(result);
  } catch (err) {
    console.error(err);
  }
}

test();