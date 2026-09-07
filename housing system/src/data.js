// Schema (eh_store_v3):
//   properties   { id, name, address, type, monthlyRevenue, ownerId, ownershipPct,
//                  amenities[], photoDataUrls[], archived }
//   units        { id, propertyId, label, bedrooms, sqft, rent, status,
//                  photoDataUrls[], floorPlanDataUrl }
//                  status: Vacant | Occupied | Under Maintenance | Notice Given
//   tenants      { id, name, email, phone, unitId, rent, status, joined, score,
//                  emergencyContact:{name,phone,rel}, employment:{employer,income,position},
//                  notes, coTenantIds[], pets[], documents[] }
//   leases       { id, tenantId, unitId, start, end, rent, deposit, status,
//                  signedAt, signatureName, addendums[], notices[],
//                  depositRefund:{amount,date,note}, recurring:{dayOfMonth,active} }
//   invoices     { id, tenantId, amount, due, paid, status, method?, lateFee?, total? }
//   expenses     { id, date, category, description, amount, propertyId?, unitId? }
//   maintenance  { id, title, unitId, tenantId, priority, status, created, updated,
//                  vendorId?, photos[], isPreventive?, scheduleCron?, dueAt? }
//   messages     { id, from, subject, preview, time, unread, thread[] }
//   announcements{ id, subject, body, createdAt }
//   owners       { id, name, email, phone, ownershipPct, notes }
//   vendors      { id, name, trade, phone, email, notes }
//   documents    { id, name, kind, entityType, entityId, mime, dataUrl, uploadedAt }
//   payments     { id, invoiceId, amount, method, paidAt, note, receiptNo }
//   notifications{ id, kind, title, body, refType, refId, createdAt, read }
//   auditLog     { id, actor, action, entityType, entityId, detail, at }

export function initialSeedV3() {
  return {
    properties: [],
    units: [],
    tenants: [],
    leases: [],
    invoices: [],
    expenses: [],
    maintenance: [],
    messages: [],
    announcements: [],
    owners: [],
    vendors: [],
    documents: [],
    payments: [],
    notifications: [],
    auditLog: []
  };
}

// v2 key was eh_store_v2 with: properties/units/tenants/leases/invoices/expenses/
// maintenance/messages. Map forward without losing anything.
export function migrateV2toV3(v2) {
  if (!v2 || typeof v2 !== "object") return initialSeedV3();
  const v3 = initialSeedV3();
  for (const k of Object.keys(v2)) {
    if (Array.isArray(v2[k]) && Array.isArray(v3[k])) v3[k] = v2[k].slice();
  }
  // Backfill new fields on existing rows so the rest of the app doesn't have to
  // guard everywhere.
  v3.properties = v3.properties.map((p) => ({
    ownerId: "",
    ownershipPct: 100,
    amenities: [],
    photoDataUrls: [],
    archived: false,
    ...p
  }));
  v3.units = v3.units.map((u) => ({
    status: u.vacant ? "Vacant" : "Occupied",
    photoDataUrls: [],
    floorPlanDataUrl: "",
    ...u
  }));
  v3.tenants = v3.tenants.map((t) => ({
    emergencyContact: { name: "", phone: "", rel: "" },
    employment: { employer: "", income: 0, position: "" },
    notes: "",
    coTenantIds: [],
    pets: [],
    documents: [],
    ...t
  }));
  v3.leases = v3.leases.map((l) => ({
    signedAt: "",
    signatureName: "",
    addendums: [],
    notices: [],
    depositRefund: { amount: 0, date: "", note: "" },
    recurring: { dayOfMonth: 1, active: false },
    ...l
  }));
  v3.invoices = v3.invoices.map((i) => ({ method: "", ...i }));
  v3.maintenance = v3.maintenance.map((m) => ({
    vendorId: "",
    photos: [],
    isPreventive: false,
    scheduleCron: "",
    dueAt: "",
    ...m
  }));
  return v3;
}

// Backwards-compat export so older imports of `initialSeed` keep working.
export function initialSeed() {
  return initialSeedV3();
}
