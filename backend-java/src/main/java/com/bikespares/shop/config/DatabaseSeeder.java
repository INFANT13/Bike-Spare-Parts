package com.bikespares.shop.config;

import com.bikespares.shop.model.*;
import com.bikespares.shop.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.*;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        seedUsers();
        seedCategoriesAndProducts();
    }

    private void seedUsers() {
        if (userRepository.count() == 0) {
            // Seed Admin User
            User admin = User.builder()
                    .name("System Administrator")
                    .email("admin@bikespareparts.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role("admin")
                    .phone("9876543210")
                    .address("Admin Headquarters, Bike City, PIN 600001")
                    .build();
            userRepository.save(admin);
            cartRepository.save(Cart.builder().user(admin).build());

            // Seed Customer User
            User customer = User.builder()
                    .name("John Doe")
                    .email("customer@bikespareparts.com")
                    .password(passwordEncoder.encode("customer123"))
                    .role("customer")
                    .phone("9998887776")
                    .address("45, Rider Lane, Velocity Road, Bangalore, PIN 560001")
                    .build();
            userRepository.save(customer);
            cartRepository.save(Cart.builder().user(customer).build());

            System.out.println("Default users seeded (Admin: admin@bikespareparts.com, Customer: customer@bikespareparts.com).");
        }
    }

    private void seedCategoriesAndProducts() {
        if (categoryRepository.count() == 0) {
            // Create Categories
            Category brakes = Category.builder()
                    .name("Brakes & Friction")
                    .slug("brakes-friction")
                    .description("High-performance brake pads, disc rotors, brake fluids, and calipers.")
                    .image("/uploads/cat_brakes.jpg")
                    .build();

            Category engine = Category.builder()
                    .name("Engine & Transmission")
                    .slug("engine-transmission")
                    .description("Spark plugs, oil filters, chains, sprockets, air filters, and engine components.")
                    .image("/uploads/cat_engine.jpg")
                    .build();

            Category suspension = Category.builder()
                    .name("Suspension & Steering")
                    .slug("suspension-steering")
                    .description("Mono-shocks, front fork dampers, steering cones, handlebars, and grips.")
                    .image("/uploads/cat_suspension.jpg")
                    .build();

            Category electrical = Category.builder()
                    .name("Electrical & Lighting")
                    .slug("electrical-lighting")
                    .description("LED headlights, batteries, starter motors, horn kits, and turn signals.")
                    .image("/uploads/cat_electrical.jpg")
                    .build();

            Category accessories = Category.builder()
                    .name("Accessories & Body")
                    .slug("accessories-body")
                    .description("Rearview mirrors, crash guards, seat covers, body decals, and polish.")
                    .image("/uploads/cat_accessories.jpg")
                    .build();

            categoryRepository.saveAll(Arrays.asList(brakes, engine, suspension, electrical, accessories));
            System.out.println("Product categories seeded.");

            // Create Products
            List<Product> products = new ArrayList<>();

            products.add(Product.builder()
                    .name("Ceramic Front Brake Pads")
                    .sku("BRK-PAD-CER-01")
                    .slug("ceramic-front-brake-pads")
                    .description("Premium ceramic friction material brake pads designed for quick stops, zero noise, and low dust. Extends disc rotor life.")
                    .price(new BigDecimal("549.00"))
                    .stock(60)
                    .image("/uploads/prod_brake_pads.jpg")
                    .category(brakes)
                    .specifications("{\"Material\": \"Ceramic Compound\", \"Compatibility\": \"Universal 150cc-250cc (Honda, Yamaha, TVS)\", \"Position\": \"Front Wheel\", \"Operating Temp\": \"Up to 400°C\", \"Lifespan\": \"18,000 km\"}")
                    .build());

            products.add(Product.builder()
                    .name("Ventilated Rear Brake Disc Rotor")
                    .sku("BRK-DISC-ROT-02")
                    .slug("ventilated-rear-brake-disc-rotor")
                    .description("High carbon stainless steel ventilated disc rotor. Provides excellent heat dissipation during heavy braking.")
                    .price(new BigDecimal("1350.00"))
                    .stock(20)
                    .image("/uploads/prod_disc_rotor.jpg")
                    .category(brakes)
                    .specifications("{\"Material\": \"SUS420 Stainless Steel\", \"Size\": \"240 mm Diameter\", \"Thickness\": \"4.5 mm\", \"Compatibility\": \"Bajaj Pulsar 150/180/220, TVS Apache RTR\"}")
                    .build());

            products.add(Product.builder()
                    .name("NGK Iridium Spark Plug CPR8EAGP-9")
                    .sku("ENG-SPK-NGK-01")
                    .slug("ngk-iridium-spark-plug")
                    .description("Fine iridium tip ensures high durability and a consistently stable spark. Improves fuel efficiency and throttle response.")
                    .price(new BigDecimal("680.00"))
                    .stock(120)
                    .image("/uploads/prod_spark_plug.jpg")
                    .category(engine)
                    .specifications("{\"Brand\": \"NGK Spark Plugs\", \"Material\": \"Iridium Center Electrode\", \"ThreadSize\": \"10 mm\", \"Reach\": \"19 mm\", \"Compatibility\": \"KTM Duke 200/250/390, Yamaha R15/MT15\"}")
                    .build());

            products.add(Product.builder()
                    .name("High-Flow Spin-On Oil Filter")
                    .sku("ENG-FLT-OIL-02")
                    .slug("high-flow-spin-on-oil-filter")
                    .description("Synthetic blend media designed for ultimate flow with less pressure drop. Traps 99% of harmful engine contaminants.")
                    .price(new BigDecimal("180.00"))
                    .stock(150)
                    .image("/uploads/prod_oil_filter.jpg")
                    .category(engine)
                    .specifications("{\"Type\": \"Spin-On Cartridge\", \"Height\": \"65 mm\", \"Filtering Media\": \"Resin Impregnated Synthetic Fiber\", \"Compatibility\": \"Yamaha FZ, R15, Suzuki Gixxer, KTM Duke\"}")
                    .build());

            products.add(Product.builder()
                    .name("Gold O-Ring Chain & Sprocket Kit")
                    .sku("ENG-CHN-SPR-03")
                    .slug("gold-o-ring-chain-sprocket-kit")
                    .description("Heavy duty 428-series O-Ring chain with matching front and rear sprockets. Gold plating prevents rust and extends chain life.")
                    .price(new BigDecimal("2599.00"))
                    .stock(18)
                    .image("/uploads/prod_chain_kit.jpg")
                    .category(engine)
                    .specifications("{\"ChainType\": \"428 O-Ring (Heavy Duty)\", \"SprocketSize\": \"Front: 14T, Rear: 42T\", \"Material\": \"High-Tensile Carbon Steel\", \"Durability\": \"25,000+ km\"}")
                    .build());

            products.add(Product.builder()
                    .name("Gas-Charged Rear Mono-Shock Absorber")
                    .sku("SUS-SHK-MONO-01")
                    .slug("gas-charged-rear-mono-shock-absorber")
                    .description("Premium nitrogen gas-charged rear shock absorber. Offers a smooth ride with 5 levels of spring preload adjustability.")
                    .price(new BigDecimal("3950.00"))
                    .stock(12)
                    .image("/uploads/prod_mono_shock.jpg")
                    .category(suspension)
                    .specifications("{\"Type\": \"Nitrogen Gas-Charged Mono-tube\", \"Length\": \"290 mm Eye-to-Eye\", \"Adjustability\": \"5-Step Adjustable Preload\", \"Compatibility\": \"Yamaha FZ series, Honda CB Hornet\"}")
                    .build());

            products.add(Product.builder()
                    .name("Soft Rubber Handlebar Grips (Pair)")
                    .sku("SUS-GRP-RUB-02")
                    .slug("soft-rubber-handlebar-grips")
                    .description("Non-slip thermoplastic rubber handlebar grips with a stylish diamond-tread pattern. Absorbs road vibration.")
                    .price(new BigDecimal("249.00"))
                    .stock(90)
                    .image("/uploads/prod_grips.jpg")
                    .category(suspension)
                    .specifications("{\"Material\": \"TPR (Thermoplastic Rubber)\", \"Length\": \"120 mm\", \"InnerDiameter\": \"Left: 22mm, Right: 24mm (Throttle Side)\", \"Color\": \"Stealth Black\"}")
                    .build());

            products.add(Product.builder()
                    .name("H4 LED Headlight Bulb (6000K)")
                    .sku("ELC-LGT-LED-01")
                    .slug("h4-led-headlight-bulb")
                    .description("High intensity LED headlight replacement bulb. Emits 4500 lumens of cool white light. Zero warm-up time.")
                    .price(new BigDecimal("999.00"))
                    .stock(45)
                    .image("/uploads/prod_led_bulb.jpg")
                    .category(electrical)
                    .specifications("{\"SocketType\": \"H4 (High/Low Beam)\", \"Brightness\": \"4500 Lumens\", \"ColorTemp\": \"6000K Cool White\", \"Power\": \"35W per Bulb\", \"Life\": \"30,000 Hours\"}")
                    .build());

            products.add(Product.builder()
                    .name("Maintenance-Free VRLA 12V 5Ah Battery")
                    .sku("ELC-BAT-VRLA-02")
                    .slug("maintenance-free-vrla-battery")
                    .description("Sealed Lead Acid (VRLA) battery. Completely leak-proof, vibration-resistant, and maintenance-free. High cranking power.")
                    .price(new BigDecimal("1799.00"))
                    .stock(35)
                    .image("/uploads/prod_battery.jpg")
                    .category(electrical)
                    .specifications("{\"Voltage\": \"12V\", \"Capacity\": \"5 Ah\", \"Type\": \"VRLA (Valve Regulated Lead Acid)\", \"Dimensions\": \"113mm x 70mm x 105mm\", \"Warranty\": \"24 Months\"}")
                    .build());

            products.add(Product.builder()
                    .name("Carbon Fiber Rearview Mirrors")
                    .sku("ACC-MIR-CF-01")
                    .slug("carbon-fiber-rearview-mirrors")
                    .description("Aerodynamic sporty mirrors finished in a premium carbon fiber weave pattern. Wide angle glass for maximum blind spot visibility.")
                    .price(new BigDecimal("799.00"))
                    .stock(40)
                    .image("/uploads/prod_mirrors.jpg")
                    .category(accessories)
                    .specifications("{\"Material\": \"Impact-Resistant ABS + Glass\", \"Finish\": \"Carbon Fiber Texture\", \"ThreadSize\": \"10 mm Clockwise\", \"Fitment\": \"Standard Commuter & Sports Bikes\"}")
                    .build());

            productRepository.saveAll(products);
            System.out.println("Products seeded successfully.");
        }
    }
}
