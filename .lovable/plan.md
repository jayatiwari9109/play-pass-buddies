## Fitnfreakk Funzone App - Plan

Gym game pass management system with member tracking, pass plans, game slot booking, and history.

### Features

1. **Members Management**
   - Add/view gym members: Full Name, Age, Mobile, Member ID
   - Click member → full history (games played, passes taken, validity, status)

2. **Pass Plans (Activate + Topup)**
   - Plan 1: 3 passes / 30 days
   - Plan 2: 6 passes / 60 days
   - Plan 3: 10 / 90, Plan 4: 13 / 120, ... Plan 12: 48 / 360
   - Topup 1-10: 1/30, 2/30, 3/30, 4/60, 5/60, 6/60, 7/90, 8/90, 9/90, 10/90
   - Active/Inactive status auto-computed from validity date & remaining passes
   - When expired → topup option shown

3. **Games**
   - Default: Pool (2 players), Table Tennis (4), Air Hockey (2), Carrom (4), Dart (4)
   - Add custom games with max player capacity

4. **Slots & Bookings**
   - Time slots: 7 AM – 9 PM, 1-hour each (14 slots/day)
   - Date-wise bookings
   - Assign members with active passes to a game+slot
   - Prevent double-booking (same member can't be in 2 games same slot)
   - Enforce max players per game
   - Deduct 1 pass per booking

5. **Views**
   - Dashboard: today's slot-wise list showing which member is playing which game
   - Members list with active/inactive badge
   - History per member (date-wise)

### Technical

- **Storage**: Lovable Cloud (Supabase) — tables: `members`, `plans`, `topups`, `games`, `pass_purchases`, `bookings`
- **Stack**: TanStack Start + React + Tailwind + shadcn
- **Auto validity**: computed on read — pass active if `expires_at > now()` AND `remaining_passes > 0`
- **Design**: Bold sporty theme — energetic accent color, clean cards, mobile-friendly (you'll use it at the gym)

### Pages

- `/` Dashboard — today's slot grid + quick stats
- `/members` — list + add + click → detail/history
- `/bookings` — date+slot view, assign members to games
- `/games` — manage games list
- `/plans` — reference table of plans/topups

Building this now with Lovable Cloud enabled for data persistence.
