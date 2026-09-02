const officeLat = parseFloat(process.env.OFFICE_LAT);
const officeLng = parseFloat(process.env.OFFICE_LNG);
const officeRadiusMeters = parseInt(process.env.OFFICE_RADIUS_METERS, 10) || 100;

module.exports = { officeLat, officeLng, officeRadiusMeters };
