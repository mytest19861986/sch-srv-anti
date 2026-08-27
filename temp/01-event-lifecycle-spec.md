# 01 - Attendance Event Lifecycle & State Machine Specification

## 1. Domain Event Types
The attendance event lifecycle supports five distinct statuses:
- `PICKED_UP`: Student boarded the vehicle.
- `DROPPED_OFF`: Student safely exited the vehicle at destination (school/home).
- `ABSENT`: Student marked absent for the day. Can only be recorded by `SCHOOL_ADMIN` or `SCHOOL_OPERATOR`.
- `CANCELLED`: Soft-invalidation of the immediately preceding event. Append-only record with `cancelled_event_id`.
- `CORRECTED`: Administrative adjustment of a previously recorded event. Only by `SCHOOL_ADMIN` or `SCHOOL_OPERATOR`. Requires `correction_reason` (min 10 characters) and references `correction_of_event_id`.

## 2. State Transition Rules & Guard Constraints
1. **PICKED_UP**:
   - Valid only if no active pickup exists for the student on the current calendar date.
2. **DROPPED_OFF**:
   - Valid only if the last recorded event for the student today is in state `PICKED_UP`.
3. **ABSENT**:
   - Valid only if NO event has been recorded for the student today.
   - Restricted to `SCHOOL_ADMIN` or `SCHOOL_OPERATOR`.
4. **CANCELLED**:
   - Can only cancel the latest active event of the day.
   - Stores `cancelled_event_id` referencing the target event.
5. **CORRECTED**:
   - Requires administrative role (`SCHOOL_ADMIN` / `SCHOOL_OPERATOR`).
   - Requires `correction_reason` of at least 10 characters.
   - The target event is marked `corrected = true`.
   - The new event record links via `correction_of_event_id`.

## 3. Error Responses
Any transition violating the state machine constraints must immediately return `409 Conflict` with:
```json
{
  "statusCode": 409,
  "error": "Conflict",
  "code": "INVALID_STATE_TRANSITION",
  "message": "Cannot transition to DROPPED_OFF without active PICKED_UP event today."
}
```
