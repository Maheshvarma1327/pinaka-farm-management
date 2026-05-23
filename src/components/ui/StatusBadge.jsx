import React from 'react';

/**
 * Maps system-wide status strings to designated styles.
 */
export default function StatusBadge({ status }) {
  if (!status) return null;

  const normalized = status.trim().toUpperCase();

  let badgeClass = "badge-secondary";
  
  switch (normalized) {
    // Active / Success States
    case 'ACTIVE':
    case 'SUCCESSFUL':
    case 'PAID':
    case 'RECOVERED':
    case 'EXCELLENT':
    case 'GOOD':
      badgeClass = "badge-success";
      break;

    // Warning / Pending States
    case 'PENDING':
    case 'PREGNANT':
    case 'LACTATING':
    case 'INSEMINATION':
    case 'ARTIFICIAL INSEMINATION':
    case 'FAIR':
    case 'UNDER OBSERVATION':
    case 'LOW STOCK':
    case 'RECOVERING':
      badgeClass = "badge-warning";
      break;

    // Danger / Alert States
    case 'DEAD':
    case 'CULLED':
    case 'FAILED':
    case 'EXPIRED':
    case 'OUT OF STOCK':
    case 'INACTIVE':
    case 'SLAUGHTERED':
    case 'POOR':
    case 'CRITICAL':
    case 'UNDER TREATMENT':
      badgeClass = "badge-danger";
      break;

    // Info / Neutral States
    case 'WEANED':
    case 'GROWER':
    case 'PIGLET':
    case 'SOW':
    case 'BOAR':
    case 'NATURAL':
    case 'INCOME':
    case 'AVAILABLE':
    case 'BREEDING CANDIDATE':
    case 'VACCINE':
    case 'ANTIBIOTIC':
    case 'DEWORMER':
    case 'VITAMIN':
    case 'OTHER':
      badgeClass = "badge-info";
      break;
      
    case 'EXPENSE':
    case 'SOLD':
    case 'PROMOTED':
    case 'PROMOTED TO SOW':
    case 'PROMOTED TO BOAR':
    case 'RETIRED':
    case 'RECOVERED':
      badgeClass = "badge-secondary";
      break;

    default:
      badgeClass = "badge-secondary";
  }

  return (
    <span className={badgeClass}>
      {status}
    </span>
  );
}
