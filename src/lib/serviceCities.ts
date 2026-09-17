export const SERVICE_CITIES = [
  'Delhi NCR',
  'Jaipur',
  'Bangalore',
  'Kolkata',
  'Indore',
  'Pune',
  'Hyderabad',
  'Mumbai',
  'Kanpur',
  'Chennai',
  'Jammu',
  'Lucknow',
  'Chandigarh',
  'Ahmedabad',
] as const;

export type ServiceCity = (typeof SERVICE_CITIES)[number];
