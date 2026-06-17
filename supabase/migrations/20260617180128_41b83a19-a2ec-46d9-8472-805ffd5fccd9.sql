WITH brands(bname, bcolor) AS (
  VALUES
    ('American Airlines','#0078D2'),
    ('Avis','#D4002A'),
    ('Belmond','#1A1A1A'),
    ('Booking.com','#003580'),
    ('Cathay Pacific','#006564'),
    ('Choice Hotels','#F58220'),
    ('Costa','#003DA5'),
    ('Cunard','#000000'),
    ('Disney','#1A1A4E'),
    ('Emirates','#D71921'),
    ('Fairmont','#1A3E5C'),
    ('Hilton','#104C97'),
    ('Holland America Line','#0033A0'),
    ('Hyatt','#1F2A44'),
    ('Iberostar','#0066B3'),
    ('IHG','#0033A0'),
    ('Lufthansa','#05164D'),
    ('Mandarin Oriental','#C8102E'),
    ('Marina Bay Sands','#1A1A1A'),
    ('Visit Estonia','#0F4DB1')
),
svgs AS (
  SELECT bname, bcolor,
    'data:image/svg+xml;base64,'||encode(convert_to(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 260" role="img" aria-label="'||bname||' wordmark"><rect width="960" height="260" fill="none"/><text x="480" y="155" text-anchor="middle" fill="'||bcolor||'" font-family="Georgia, ''Times New Roman'', serif" font-size="78" font-weight="700" letter-spacing="2">'||bname||'</text></svg>'
    ,'UTF8'),'base64') AS color_url,
    'data:image/svg+xml;base64,'||encode(convert_to(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 260" role="img" aria-label="'||bname||' wordmark"><rect width="960" height="260" fill="none"/><text x="480" y="155" text-anchor="middle" fill="#ffffff" font-family="Georgia, ''Times New Roman'', serif" font-size="78" font-weight="700" letter-spacing="2">'||bname||'</text></svg>'
    ,'UTF8'),'base64') AS white_url,
    'data:image/svg+xml;base64,'||encode(convert_to(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 260" role="img" aria-label="'||bname||' wordmark"><rect width="960" height="260" fill="none"/><text x="480" y="155" text-anchor="middle" fill="#000000" font-family="Georgia, ''Times New Roman'', serif" font-size="78" font-weight="700" letter-spacing="2">'||bname||'</text></svg>'
    ,'UTF8'),'base64') AS black_url
  FROM brands
)
UPDATE public.global_client_logos g
SET files = COALESCE(g.files,'[]'::jsonb) || jsonb_build_array(
      jsonb_build_object('variant','color','format','svg','lockup','wordmark','url', s.color_url),
      jsonb_build_object('variant','white','format','svg','lockup','wordmark','url', s.white_url),
      jsonb_build_object('variant','black','format','svg','lockup','wordmark','url', s.black_url)
    ),
    updated_at = now()
FROM svgs s
WHERE g.name = s.bname;