/*
 * Migration export implementation. Read-only, AsNoTracking for bulk export.
 */

using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolBusAPI.Models;

namespace SchoolBusAPI.Services
{
    /// <summary>
    /// Exports full entity sets for migration; read-only, no tracking
    /// </summary>
    public class MigrationService : IMigrationService
    {
        private readonly DbAppContext _context;

        public MigrationService(DbAppContext context)
        {
            _context = context;
        }

        /// <inheritdoc />
        public IActionResult GetInspections(int? skip, int? take)
        {
            var query = _context.Inspections
                .AsNoTracking()
                .Include(x => x.SchoolBus)
                .Include(x => x.Inspector)
                .OrderBy(x => x.Id);

            var list = ApplyPagination(query, skip, take).ToList();
            return new ObjectResult(list);
        }

        /// <inheritdoc />
        public IActionResult GetSchoolBuses(int? skip, int? take)
        {
            var query = _context.SchoolBuss
                .AsNoTracking()
                .Include(x => x.HomeTerminalCity)
                .Include(x => x.SchoolDistrict)
                .Include(x => x.SchoolBusOwner).ThenInclude(o => o.PrimaryContact)
                .Include(x => x.District).ThenInclude(d => d.Region)
                .Include(x => x.Inspector)
                .Include(x => x.CCWData)
                .Include(x => x.Notes)
                .Include(x => x.Attachments)
                .Include(x => x.History)
                .Include(x => x.CCWNotifications)
                .OrderBy(x => x.Id);

            var list = ApplyPagination(query, skip, take).ToList();
            return new ObjectResult(list);
        }

        /// <inheritdoc />
        public IActionResult GetSchoolBusOwners(int? skip, int? take)
        {
            var query = _context.SchoolBusOwners
                .AsNoTracking()
                .Include(x => x.PrimaryContact)
                .Include(x => x.District)
                .Include(x => x.Contacts)
                .Include(x => x.Notes)
                .Include(x => x.Attachments)
                .Include(x => x.History)
                .OrderBy(x => x.Id);

            var list = ApplyPagination(query, skip, take).ToList();
            return new ObjectResult(list);
        }

        /// <inheritdoc />
        public IActionResult GetSchoolDistricts()
        {
            var list = _context.SchoolDistricts
                .AsNoTracking()
                .OrderBy(x => x.Id)
                .ToList();
            return new ObjectResult(list);
        }

        /// <inheritdoc />
        public IActionResult GetServiceAreas()
        {
            var list = _context.ServiceAreas
                .AsNoTracking()
                .Include(x => x.District)
                .OrderBy(x => x.Id)
                .ToList();
            return new ObjectResult(list);
        }

        /// <inheritdoc />
        public IActionResult GetContacts(int? skip, int? take)
        {
            var query = _context.Contacts
                .AsNoTracking()
                .Include(x => x.SchoolBusOwner)
                .OrderBy(x => x.Id);

            var list = ApplyPagination(query, skip, take).ToList();
            return new ObjectResult(list);
        }

        private static IQueryable<T> ApplyPagination<T>(IQueryable<T> query, int? skip, int? take)
        {
            if (skip.HasValue && skip.Value > 0)
                query = query.Skip(skip.Value);
            if (take.HasValue && take.Value > 0)
                query = query.Take(take.Value);
            return query;
        }
    }
}
