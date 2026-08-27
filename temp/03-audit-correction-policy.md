# 03 - Audit Correction Policy & Append-Only Log Requirements

## 1. Regulatory Context & Traceability
Modifying child attendance records is a safety-critical operation. Any correction or invalidation must never overwrite or mutate existing database rows in-place.

## 2. Event Correction Workflow
1. Administrative User (`SCHOOL_ADMIN` or `SCHOOL_OPERATOR`) submits a `CORRECTED` event.
2. Mandatory Fields:
   - `correction_of_event_id`: Identifier of the erroneous record.
   - `correction_reason`: Description of the correction (minimum 10 characters).
3. Database Actions:
   - Mark the original event as `corrected = true`.
   - Insert new `CORRECTED` row with the accurate data points.
   - Create an immutable record in `audit_logs` capturing the BEFORE and AFTER state snapshots:
     ```json
     {
       "action": "ATTENDANCE_EVENT_CORRECTED",
       "entity": "attendance_events",
       "entity_id": "orig_event_uuid",
       "actor_id": "school_admin_id",
       "actor_role": "SCHOOL_ADMIN",
       "tenant_id": "school_tenant_id",
       "metadata": {
         "before": { "status": "PICKED_UP", "timestamp": "2026-08-27T07:15:00Z" },
         "after": { "status": "ABSENT", "correction_reason": "Parent called in sick" }
       }
     }
     ```
