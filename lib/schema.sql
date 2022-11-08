CREATE TABLE coffees (
  id serial PRIMARY KEY,
  name text NOT NULL,
  roaster_name text NOT NULL,
  country_of_origin text NOT NULL,
  region_of_origin text NOT NULL,
  process text NOT NULL,
  bag_price numeric (4,2),
  description text,
  date date DEFAULT CURRENT_DATE,
  username text NOT NULL
);

CREATE TABLE brews (
  id serial PRIMARY KEY,
  method text NOT NULL,
  description text NOT NULL,
  date date DEFAULT CURRENT_DATE,
  coffee_id integer NOT NULL REFERENCES coffees (id) ON DELETE CASCADE,
  username text NOT NULL
);
