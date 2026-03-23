/*
 * Migration export endpoints for moving data to new system.
 * Used by Hangfire in the new app to pull full entity sets.
 */

using Microsoft.AspNetCore.Mvc;

namespace SchoolBusAPI.Services
{
    /// <summary>
    /// Service that returns full entity data for migration export
    /// </summary>
    public interface IMigrationService
    {
        /// <summary>All inspections with SchoolBus and Inspector</summary>
        IActionResult GetInspections(int? skip, int? take);

        /// <summary>All school buses with Notes, Attachments, History, CCWData, related entities</summary>
        IActionResult GetSchoolBuses(int? skip, int? take);

        /// <summary>All school bus owners with Contacts, Notes, Attachments, History</summary>
        IActionResult GetSchoolBusOwners(int? skip, int? take);

        /// <summary>All school districts</summary>
        IActionResult GetSchoolDistricts();

        /// <summary>All service areas with District</summary>
        IActionResult GetServiceAreas();

        /// <summary>All contacts with SchoolBusOwner</summary>
        IActionResult GetContacts(int? skip, int? take);
    }
}
