# Testing Guide - Complete Web API Implementation

## Prerequisites

1. ✅ NPM installed (`npm --version`)
2. ✅ Visual Studio Code with PCF tools
3. ✅ Access to Dynamics 365 environment
4. ✅ Test facility with active juveniles in system
5. ✅ Web API permissions for your user

## Step 1: Build the Control

```powershell
cd "c:\Users\Teja Vavilala\Downloads\PcfControls\PCFComponents Final\DailyCensusPCFControl"
npm install
npm run build
```

Expected output:
```
✓ Build succeeded
✓ Output: dist/
```

## Step 2: Test Locally (if configured)

```powershell
npm run start
```

Navigate to: `http://localhost:3000`

Expected behavior:
- Page loads
- Shows "Loading census data..." spinner
- Spinner disappears after ~2-3 seconds
- Displays resident list with statuses

## Step 3: Package for Deployment

```powershell
npm run package
```

Expected output:
```
✓ Package generated: DailyCensusSummary.zip (or .solution file)
```

## Step 4: Upload to Dynamics

1. Open Dynamics 365
2. Go to Solutions
3. Import Solution
4. Select the packaged file
5. Click Import
6. Wait for import to complete

## Step 5: Add Control to Form

1. Go to Daily Census entity form
2. Edit form
3. Add Control → Power Apps Component Framework
4. Select "DailyCensusSummary"
5. Configure:
   - Bind "residentCensus" dataset to Unit Census Resident view
   - Set "facilityId" parameter (optional)
   - Set "facilityTotal" field (optional)
   - Set "assignedTotal" field (optional)
6. Save and publish

## Step 6: Test Search

### Test 6.1: View All Active Juveniles

```
Action: Click search box
Expected: Shows dropdown with all active juveniles from facility
Example: 
  - John Doe (BJJS-1001)
  - Jane Smith (BJJS-1002)
  - James Brown (BJJS-1003)
  ... etc
```

### Test 6.2: Search by Name

```
Action: Type "john" in search box
Expected: Filters to show only juveniles with "john" in name
Result: Shows "John Doe", "John Smith" etc.
```

### Test 6.3: Search by ID

```
Action: Type "BJJS-10" in search box
Expected: Filters to show only juveniles with "BJJS-10" in ID
Result: Shows matching IDs
```

### Test 6.4: Clear Search

```
Action: Clear search box
Expected: Shows all active juveniles again (full list)
```

## Step 7: Test Add Resident

### Test 7.1: Add to AWOL Status

```
Action:
  1. Search "John Doe"
  2. Click "John Doe" result
  3. Click in "AWOL" status section
  4. See "John Doe" added to AWOL list

Expected in UI:
  ✓ "John Doe" now shows under AWOL
  ✓ AWOL count incremented
  ✓ "John Doe" disappears from search

Expected in Dynamics:
  ✓ Unit Census Resident record created
  ✓ _ucm_juvenile_value = John Doe's offender ID
  ✓ ucm_purpose = "AWOL" (OptionSet value)
  ✓ ucm_date = today's date (2026-07-21T00:00:00Z)
  ✓ _ucm_facility_value = current facility ID
```

### Test 7.2: Add to Different Status

```
Action:
  1. Search "Jane Smith"
  2. Click in "Home Pass" section
  3. Select "Jane Smith"

Expected:
  ✓ "Jane Smith" now shows under "Home Pass"
  ✓ Count updated
  ✓ New Unit Census Resident created with ucm_purpose = "Home Pass"
```

### Test 7.3: Add Same Juvenile to Multiple Statuses

```
Action:
  1. Add "James Brown" to "AWOL"
  2. Remove from "AWOL"
  3. Search "James Brown" → Should reappear
  4. Add to "Home Pass"

Expected:
  ✓ "James Brown" under "Home Pass"
  ✓ Previous "AWOL" record is deactivated
  ✓ New "Home Pass" record created
  ✓ Both records in Dynamics (one active, one inactive)
```

## Step 8: Test Remove Resident

### Test 8.1: Remove from Status

```
Action:
  1. Find "John Doe" in "AWOL" section
  2. Click the X or unselect
  3. "John Doe" removed from AWOL

Expected in UI:
  ✓ "John Doe" removed from AWOL list
  ✓ AWOL count decremented
  ✓ "John Doe" reappears in search

Expected in Dynamics:
  ✓ Unit Census Resident record STILL EXISTS
  ✓ statuscode = 2 (Inactive - Deactivated)
  ✓ Not deleted, just deactivated
```

### Test 8.2: Verify Record Status

```
In Dynamics:
  1. Open Unit Census Residents
  2. Find "John Doe" record
  3. Check Status field

Expected: Status = "Inactive" or "Deactivated"
Result: Shows statuscode = 2
```

## Step 9: Test Refresh/Persistence

### Test 9.1: Page Refresh

```
Action:
  1. Add "John Doe" to "AWOL"
  2. Press F5 (refresh page)
  3. Wait for data to reload

Expected:
  ✓ "John Doe" still shows in "AWOL"
  ✓ Data not lost after refresh
  ✓ Component reloaded from Dynamics
```

### Test 9.2: Close and Reopen

```
Action:
  1. Add residents
  2. Close form
  3. Reopen Daily Census
  4. Open this form again

Expected:
  ✓ All added residents still show
  ✓ Data persisted in Dynamics
```

## Step 10: Test Error Handling

### Test 10.1: Network Error

```
Setup:
  1. Turn off network (offline)
  2. Open form

Expected:
  ✓ Shows error: "Failed to load census data"
  ✓ Clear error message to user
  ✓ Component doesn't crash
  ✓ When network returns, can try again
```

### Test 10.2: No Facility Found

```
Setup:
  1. Form with invalid/missing facility
  2. Open component

Expected:
  ✓ Shows error: "No Daily Census found for this facility"
  ✓ User knows what's wrong
```

### Test 10.3: Missing Permissions

```
Setup:
  1. User without Create permission on Unit Census Residents
  2. Try to add resident

Expected:
  ✓ Shows error when trying to create
  ✓ Error message explains permission issue
  ✓ Clear message (not cryptic)
```

## Step 11: Performance Testing

### Test 11.1: Load Time

```
Measure:
  1. Open form
  2. Measure time until spinner disappears

Target: 2-5 seconds (depends on network)
- <2s: Excellent
- 2-5s: Good
- >10s: Check network, may need optimization
```

### Test 11.2: Search Speed

```
Measure:
  1. Type in search box
  2. Measure time to filter results

Target: <500ms
- <100ms: Excellent
- 100-500ms: Good
- >500ms: May need optimization for large datasets
```

### Test 11.3: Large Dataset

```
Setup:
  1. Facility with 500+ active juveniles
  2. Open form and search

Target: Should still respond in <500ms
- Fast filtering: ✓
- No UI freeze: ✓
- No memory issues: ✓
```

## Step 12: Data Integrity Testing

### Test 12.1: Required Fields Populated

```
Action:
  1. Add resident
  2. Open Dynamics → Unit Census Residents

Verify ALL fields populated:
  - ✓ ucm_date = today (2026-07-21T00:00:00Z)
  - ✓ _ucm_juvenile_value = juvenile ID
  - ✓ _ucm_dailycensus_value = daily census ID
  - ✓ _ucm_facility_value = facility ID
  - ✓ ucm_purpose = status/purpose
  - ✓ createdon = today's datetime
```

### Test 12.2: Date Field Accuracy

```
In Daily Census:
  - createdon = 2026-07-21T09:14:19Z

In Unit Census Resident:
  - ucm_date = 2026-07-21T00:00:00Z

Expected:
  ✓ Date portion matches (2026-07-21)
  ✓ ucm_date is midnight of that day
  ✓ Correct date used for filtering
```

### Test 12.3: Deactivation Integrity

```
Action:
  1. Add "John Doe" to "AWOL"
  2. Remove from "AWOL"
  3. Open Dynamics → Unit Census Residents
  4. View "John Doe" record

Check:
  - ✓ Record exists (not deleted)
  - ✓ statuscode = 2 (inactive)
  - ✓ Other fields unchanged
  - ✓ Can be reactivated manually
```

## Step 13: Multi-User Testing

### Test 13.1: Concurrent Access

```
Setup:
  1. Open same Daily Census in 2 browsers
  2. User A adds "John Doe" to AWOL
  3. User B refreshes

Expected:
  ✓ User B sees "John Doe" in AWOL (after refresh)
  ✓ Data synced across users
  ✓ No conflicts
```

### Test 13.2: Lock Prevention

```
Setup:
  1. User A editing Daily Census
  2. User B tries to add residents

Expected:
  ✓ Both can add/remove (no locking issues)
  ✓ No conflict errors
```

## Troubleshooting

### Issue: "Loading..." spinner never stops

**Check:**
1. Open DevTools (F12)
2. Go to Network tab
3. Look for failed API calls
4. Verify facility ID is valid GUID

**Fix:**
- Check facility parameter is correct
- Verify Web API permissions
- Check network connectivity

### Issue: Search shows no juveniles

**Check:**
1. Are there active juveniles in facility? 
   - In Dynamics: Offenders (ucm_offenders) with statecode = 0
2. Do they belong to this facility?
3. Did API call succeed?

**Fix:**
- Add test juveniles to facility
- Verify facility ID matches
- Check console for errors

### Issue: Record not created when adding resident

**Check:**
1. Check browser console for error
2. Verify user has Create permission on ucm_unitcensusresidents
3. Check Web API is enabled

**Fix:**
- Grant Create permission
- Check security role settings
- Verify Web API enabled in org

### Issue: Records showing as deleted instead of inactive

**This shouldn't happen.** If it does:
1. Check Dynamics database directly
2. Look at Unit Census Resident audit
3. Verify deactivateUnitCensusResident was called

**Fix:**
- Reactivate records manually
- Check component console logs
- Review Web API service code

## Success Criteria

✅ **All tests pass when:**
1. Search shows all active juveniles
2. Adding juvenile creates record in Dynamics
3. Removing juvenile deactivates (not deletes) record
4. Records persist after refresh
5. Error messages are clear and helpful
6. No sample data anywhere in UI
7. All API calls succeed
8. Performance is acceptable (<5s load, <500ms search)

---

**Testing Status**: Ready for full testing
**Last Updated**: 2026-07-21
