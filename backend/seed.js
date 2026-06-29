const bcrypt = require('bcryptjs');
const { sequelize, User, Category, Product, Cart } = require('./models');
const { connectDB } = require('./config/db');

const seedDB = async () => {
  try {
    console.log('Initializing database seeding...');
    
    // Create database if not exists and connect
    await connectDB();
    
    // Connect and force sync to reset tables
    await sequelize.sync({ force: true });
    console.log('Database synced: tables dropped and recreated.');

    // 1. Seed Users
    const salt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash('admin123', salt);
    const hashedCustomerPassword = await bcrypt.hash('customer123', salt);

    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@bikespareparts.com',
      password: hashedAdminPassword,
      role: 'admin',
      phone: '9876543210',
      address: 'Admin Headquarters, Bike City, PIN 600001'
    });
    // Create cart for admin
    await Cart.create({ userId: admin.id });

    const customer = await User.create({
      name: 'John Doe',
      email: 'customer@bikespareparts.com',
      password: hashedCustomerPassword,
      role: 'customer',
      phone: '9998887776',
      address: '45, Rider Lane, Velocity Road, Bangalore, PIN 560001'
    });
    // Create cart for customer
    await Cart.create({ userId: customer.id });

    console.log('Seeded Users successfully (Admin: admin@bikespareparts.com, Customer: customer@bikespareparts.com).');

    // 2. Seed Categories
    const categoriesData = [
      {
        name: 'Brakes & Friction',
        slug: 'brakes-friction',
        description: 'High-performance brake pads, disc rotors, brake fluids, and calipers.',
        image: '/uploads/cat_brakes.jpg'
      },
      {
        name: 'Engine & Transmission',
        slug: 'engine-transmission',
        description: 'Spark plugs, oil filters, chains, sprockets, air filters, and engine components.',
        image: '/uploads/cat_engine.jpg'
      },
      {
        name: 'Suspension & Steering',
        slug: 'suspension-steering',
        description: 'Mono-shocks, front fork dampers, steering cones, handlebars, and grips.',
        image: '/uploads/cat_suspension.jpg'
      },
      {
        name: 'Electrical & Lighting',
        slug: 'electrical-lighting',
        description: 'LED headlights, batteries, starter motors, horn kits, and turn signals.',
        image: '/uploads/cat_electrical.jpg'
      },
      {
        name: 'Accessories & Body',
        slug: 'accessories-body',
        description: 'Rearview mirrors, crash guards, seat covers, body decals, and polish.',
        image: '/uploads/cat_accessories.jpg'
      }
    ];

    const categories = await Category.bulkCreate(categoriesData);
    console.log(`Seeded ${categories.length} product categories.`);

    // Map category IDs
    const catMap = {};
    categories.forEach(cat => {
      catMap[cat.slug] = cat.id;
    });

    // 3. Seed Products
    const productsData = [
      {
        name: 'Ceramic Front Brake Pads',
        sku: 'BRK-PAD-CER-01',
        slug: 'ceramic-front-brake-pads',
        description: 'Premium ceramic friction material brake pads designed for quick stops, zero noise, and low dust. Extends disc rotor life.',
        price: 549.00,
        stock: 60,
        image: '/uploads/prod_brake_pads.jpg',
        categoryId: catMap['brakes-friction'],
        specifications: {
          Material: 'Ceramic Compound',
          Compatibility: 'Universal 150cc-250cc (Honda, Yamaha, TVS)',
          Position: 'Front Wheel',
          'Operating Temp': 'Up to 400°C',
          Lifespan: '18,000 km'
        }
      },
      {
        name: 'Ventilated Rear Brake Disc Rotor',
        sku: 'BRK-DISC-ROT-02',
        slug: 'ventilated-rear-brake-disc-rotor',
        description: 'High carbon stainless steel ventilated disc rotor. Provides excellent heat dissipation during heavy braking.',
        price: 1350.00,
        stock: 20,
        image: '/uploads/prod_disc_rotor.jpg',
        categoryId: catMap['brakes-friction'],
        specifications: {
          Material: 'SUS420 Stainless Steel',
          Size: '240 mm Diameter',
          Thickness: '4.5 mm',
          Compatibility: 'Bajaj Pulsar 150/180/220, TVS Apache RTR'
        }
      },
      {
        name: 'NGK Iridium Spark Plug CPR8EAGP-9',
        sku: 'ENG-SPK-NGK-01',
        slug: 'ngk-iridium-spark-plug',
        description: 'Fine iridium tip ensures high durability and a consistently stable spark. Improves fuel efficiency and throttle response.',
        price: 680.00,
        stock: 120,
        image: '/uploads/prod_spark_plug.jpg',
        categoryId: catMap['engine-transmission'],
        specifications: {
          Brand: 'NGK Spark Plugs',
          Material: 'Iridium Center Electrode',
          ThreadSize: '10 mm',
          Reach: '19 mm',
          Compatibility: 'KTM Duke 200/250/390, Yamaha R15/MT15'
        }
      },
      {
        name: 'High-Flow Spin-On Oil Filter',
        sku: 'ENG-FLT-OIL-02',
        slug: 'high-flow-spin-on-oil-filter',
        description: 'Synthetic blend media designed for ultimate flow with less pressure drop. Traps 99% of harmful engine contaminants.',
        price: 180.00,
        stock: 150,
        image: '/uploads/prod_oil_filter.jpg',
        categoryId: catMap['engine-transmission'],
        specifications: {
          Type: 'Spin-On Cartridge',
          Height: '65 mm',
          Compatibility: 'Yamaha FZ, R15, Suzuki Gixxer, KTM Duke',
          'Filtering Media': 'Resin Impregnated Synthetic Fiber'
        }
      },
      {
        name: 'Gold O-Ring Chain & Sprocket Kit',
        sku: 'ENG-CHN-SPR-03',
        slug: 'gold-o-ring-chain-sprocket-kit',
        description: 'Heavy duty 428-series O-Ring chain with matching front and rear sprockets. Gold plating prevents rust and extends chain life.',
        price: 2599.00,
        stock: 18,
        image: '/uploads/prod_chain_kit.jpg',
        categoryId: catMap['engine-transmission'],
        specifications: {
          ChainType: '428 O-Ring (Heavy Duty)',
          SprocketSize: 'Front: 14T, Rear: 42T',
          Material: 'High-Tensile Carbon Steel',
          Durability: '25,000+ km'
        }
      },
      {
        name: 'Gas-Charged Rear Mono-Shock Absorber',
        sku: 'SUS-SHK-MONO-01',
        slug: 'gas-charged-rear-mono-shock-absorber',
        description: 'Premium nitrogen gas-charged rear shock absorber. Offers a smooth ride with 5 levels of spring preload adjustability.',
        price: 3950.00,
        stock: 12,
        image: '/uploads/prod_mono_shock.jpg',
        categoryId: catMap['suspension-steering'],
        specifications: {
          Type: 'Nitrogen Gas-Charged Mono-tube',
          Length: '290 mm Eye-to-Eye',
          Adjustability: '5-Step Adjustable Preload',
          Compatibility: 'Yamaha FZ series, Honda CB Hornet'
        }
      },
      {
        name: 'Soft Rubber Handlebar Grips (Pair)',
        sku: 'SUS-GRP-RUB-02',
        slug: 'soft-rubber-handlebar-grips',
        description: 'Non-slip thermoplastic rubber handlebar grips with a stylish diamond-tread pattern. Absorbs road vibration.',
        price: 249.00,
        stock: 90,
        image: '/uploads/prod_grips.jpg',
        categoryId: catMap['suspension-steering'],
        specifications: {
          Material: 'TPR (Thermoplastic Rubber)',
          Length: '120 mm',
          InnerDiameter: 'Left: 22mm, Right: 24mm (Throttle Side)',
          Color: 'Stealth Black'
        }
      },
      {
        name: 'H4 LED Headlight Bulb (6000K)',
        sku: 'ELC-LGT-LED-01',
        slug: 'h4-led-headlight-bulb',
        description: 'High intensity LED headlight replacement bulb. Emits 4500 lumens of cool white light. Zero warm-up time.',
        price: 999.00,
        stock: 45,
        image: '/uploads/prod_led_bulb.jpg',
        categoryId: catMap['electrical-lighting'],
        specifications: {
          SocketType: 'H4 (High/Low Beam)',
          Brightness: '4500 Lumens',
          ColorTemp: '6000K Cool White',
          Power: '35W per Bulb',
          Life: '30,000 Hours'
        }
      },
      {
        name: 'Maintenance-Free VRLA 12V 5Ah Battery',
        sku: 'ELC-BAT-VRLA-02',
        slug: 'maintenance-free-vrla-battery',
        description: 'Sealed Lead Acid (VRLA) battery. Completely leak-proof, vibration-resistant, and maintenance-free. High cranking power.',
        price: 1799.00,
        stock: 35,
        image: '/uploads/prod_battery.jpg',
        categoryId: catMap['electrical-lighting'],
        specifications: {
          Voltage: '12V',
          Capacity: '5 Ah',
          Type: 'VRLA (Valve Regulated Lead Acid)',
          Dimensions: '113mm x 70mm x 105mm',
          Warranty: '24 Months'
        }
      },
      {
        name: 'Carbon Fiber Rearview Mirrors',
        sku: 'ACC-MIR-CF-01',
        slug: 'carbon-fiber-rearview-mirrors',
        description: 'Aerodynamic sporty mirrors finished in a premium carbon fiber weave pattern. Wide angle glass for maximum blind spot visibility.',
        price: 799.00,
        stock: 40,
        image: '/uploads/prod_mirrors.jpg',
        categoryId: catMap['accessories-body'],
        specifications: {
          Material: 'Impact-Resistant ABS + Glass',
          Finish: 'Carbon Fiber Texture',
          ThreadSize: '10 mm Clockwise',
          Fitment: 'Standard Commuter & Sports Bikes'
        }
      }
    ];

    const products = await Product.bulkCreate(productsData);
    console.log(`Seeded ${products.length} spare parts products.`);

    console.log('Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Failed:', error.message);
    process.exit(1);
  }
};

seedDB();
