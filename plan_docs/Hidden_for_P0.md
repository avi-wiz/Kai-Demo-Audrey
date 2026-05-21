# Hidden for P0

Items hidden from the UI for the P0 demo. All changes are commented out (not deleted) unless noted, so they can be restored easily.

---

## 1. Kai Add-ons (Agent Store)

**File:** `src/components/layout/UnifiedSidebar.tsx` ~line 512
**What:** "Kai add-ons" nav item in the left sidebar.
**How:** Line commented out.

---

## 2. Models (under Admin/Settings)

**File:** `src/components/layout/UnifiedSidebar.tsx` ~line 530
**What:** "Models" nav item inside the Admin section of the left sidebar.
**How:** Line commented out.

---

## 3. Agents tab (under Analytics)

**File:** `src/components/dashboard/DashboardLayout.tsx` ~line 143
**What:** "Agents" tab in the Analytics dashboard (Settings → Analytics).
**How:** Line commented out in the `TABS` array.

**Also changed:** Subtitle text on the Analytics page updated from "Monitor performance, usage, and agent health" → "Monitor Performance and Usage of Kai" (~line 187).

---

## 4. Workflow Creation — Chat routing

**File:** `src/components/chat/ChatShell.tsx` ~line 2457
**What:** Intent detection block that routes queries containing "workflow" + a setup verb (set up, create, build, etc.) to the ad29 workflow setup flow.
**How:** Block commented out.

**File:** `src/components/chat/ChatShell.tsx` ~line 3219
**What:** "Create another workflow" action chip handler that re-spawns the workflow picker.
**How:** Condition replaced with `if (false) {}`.

---

## 5. Workflow Creation — Command Palette

**File:** `src/fixtures/command-palette-items.json` (entry `cmd-12`)
**What:** "Set up workflow" command (category: Admin) that pre-fills the chat input with "Set up a workflow for ".
**How:** Entry removed entirely (JSON doesn't support comments).

**To restore:** Insert the following object back into the `items` array in `command-palette-items.json`, between `cmd-11` ("Build dashboard") and `cmd-13` ("Go to Orders"):

```json
{
    "id": "cmd-12",
    "label": "Set up workflow",
    "category": "Admin",
    "query": "Set up a workflow for ",
    "icon": "workflow"
},
```

---

## 6. Workflow Creation — My Artifacts

**File:** `src/components/views/MyArtifactsView.tsx` ~line 504
**What:** "Scheduled" filter tab in My Artifacts.
**How:** Tab entry commented out in the `FilterTabs` tabs array.

**File:** `src/components/views/MyArtifactsView.tsx` ~line 627
**What:** "Scheduled Artifacts" section that lists activated workflows.
**How:** Entire JSX block commented out.

End of File