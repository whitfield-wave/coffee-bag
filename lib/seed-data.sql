INSERT INTO coffees 
(name, roaster_name, country_of_origin, region_of_origin, process, bag_price, description, username)
VALUES ('Long Miles Mikuba Honey Micro Lot 4', 'Olympia Coffee Roasters', 'Burundi', 'Mikuba', 'honey', 22.50, 'Really tasty!', 'admin'),
('DON TEÓ – HONEYED', 'Sweet Bloom', 'Nicaragua', 'Nueva Segovia', 'honey', 20.00, 'This coffee is very sweet and has a strong citrus taste.','admin');

INSERT INTO brews
(method, description, coffee_id, username)
VALUES ('Aeropress', 'It tastes like it was made with an aeropress', 1, 'admin'), ('V60', 'Tea like in the body but very sweet and almost carmel-like in flavor', 1, 'admin'), 
('Espresso', 'I felt like I just drank the essence of a kefir lime',2, 'admin');
