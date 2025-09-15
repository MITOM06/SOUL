<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Order;
use App\Models\Product;

/**
 * Factory for the OrderItem model.  Each order item belongs to an order
 * and a product.  The unit price is independent of the associated product's
 * price to simplify seeding.
 *
 * @extends Factory<\App\Models\OrderItem>
 */
class OrderItemFactory extends Factory
{
    protected $model = \App\Models\OrderItem::class;

    public function definition(): array
    {
        return [
            'order_id'        => Order::factory(),
            'product_id'      => Product::factory(),
            'unit_price_cents'=> $this->faker->numberBetween(1_000, 200_000),
            'quantity'        => $this->faker->numberBetween(1, 5),
        ];
    }
}