CREATE TABLE schema.people(
  id NUMBER GENERATED BY DEFAULT AS IDENTITY,
  name VARCHAR2(50) NOT NULL,
  category VARCHAR2(50) NOT NULL,
  active NUMBER(1) NOT NULL,
  PRIMARY KEY(id)
);

CREATE TABLE schema.activity(
  id NUMBER GENERATED BY DEFAULT AS IDENTITY,
  person_id NUMBER NOT NULL,
  created_at DATE NOT NULL,
  PRIMARY KEY(id)
);

ALTER TABLE products
ADD CONSTRAINT fk_supplier
  FOREIGN KEY (supplier_id)
  REFERENCES supplier(supplier_id);

CREATE VIEW schema.view_employee AS
  SELECT id, name, category, active
  FROM schema.people
  WHERE category = 'employee';

CREATE VIEW schema.view_active_employees AS
  SELECT id, name, category, active
  FROM schema.view_employee
  WHERE active = 1;

CREATE PUBLIC DATABASE LINK auditory
  USING 'auditory'; 