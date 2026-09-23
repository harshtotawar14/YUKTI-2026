ALTER TABLE cooperatives ALTER COLUMN region SET DEFAULT 'Maharashtra';

UPDATE cooperatives
SET name='YUKTI Kolhapur Services Cooperative',
    region='Kolhapur, Maharashtra'
WHERE code='YUKTI-01';

UPDATE cooperatives
SET name='YUKTI Panhala Worker Cooperative',
    region='Panhala, Kolhapur, Maharashtra'
WHERE code='NARMADA-02';
