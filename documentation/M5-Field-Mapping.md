
# Dashboard & Safety Management
## Field Mapping Document

### 1. Dashboard Overview

| Required information | Possible data source | Purpose |
|---|---|---|
| Total medicines | Medicine records | Display total medicines |
| Total stock quantity | Medicine and batch records | Display available stock |
| Low-stock medicines | Medicine and batch records | Identify medicines with low stock |
| Expiring batches | Batch records | Display batches nearing expiry |
| Critical alerts | Alerts | Display important warnings |

### 2. Expiry & Stock Alerts

| Required information | Possible data source | Purpose |
|---|---|---|
| Medicine name | Medicine records | Identify the medicine |
| Batch number | Batch records | Identify the batch |
| Expiry date | Batch records | Check expiry |
| Available quantity | Batch records | Check remaining stock |
| Alert level | Alerts | Show alert severity |
| Alert status | Alerts | Show whether the alert is active or resolved |

### 3. Community Demand

| Required information | Possible data source | Purpose |
|---|---|---|
| Medicine name | Availability requests | Identify requested medicine |
| Requested quantity | Availability requests | Understand demand |
| Request date | Availability requests | Track when requests were made |
| Requested area | Availability requests | Identify demand by area |

### 4. Safety Notices

| Required information | Possible data source | Purpose |
|---|---|---|
| Medicine name | Safety notices | Identify affected medicine |
| Notice title | Safety notices | Display notice |
| Notice description | Safety notices | Explain the safety issue |
| Verification status | Safety notices | Show whether notice is verified |
| Matched batch | Batch records / notice matches | Identify affected batches |
| Notification status | Notifications | Track sent notifications |

### 5. Add Verified Medicine Safety Notice

| Required information | Possible data source | Purpose |
|---|---|---|
| Medicine name or ID | Medicine records | Identify medicine |
| Notice title | Safety notices | Store notice title |
| Notice type | Safety notices | Categorize the notice |
| Description | Safety notices | Explain the issue |
| Source reference | Safety notices | Record the information source |
| Verification status | Safety notices | Track verification |

### 6. Reports

| Required information | Possible data source | Purpose |
|---|---|---|
| Total medicines | Medicine records | Medicine summary |
| Low-stock count | Medicine and batch records | Stock summary |
| Expiring batch count | Batch records | Expiry summary |
| Expired batch count | Batch records | Expired stock summary |
| Critical alert count | Alerts | Safety summary |
| Community demand | Availability requests | Demand summary |
