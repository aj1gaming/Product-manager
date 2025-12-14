import { json } from "@remix-run/node";
import { prisma } from "../db.server";

export const action = async ({ request }) => {
  const formData = await request.formData();

  const productId = formData.get("productId");
  const email = formData.get("email");
  const text = formData.get("text");
  const name = formData.get("name") || "";

  let customerId = formData.get("customerId") || null;
  if (customerId && !customerId.startsWith("gid://")) {
    customerId = `gid://shopify/Customer/${customerId}`;
  }

  if (!productId || !email || !text) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

  await prisma.ProductComment.create({
    data: {
      productId,
      email,
      text,
      name, 
      customerId,
    },
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "https://smittencosmetics.com.au",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

