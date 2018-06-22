﻿using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.IO;
using System.Net;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using SchoolBusAPI.Models;
using SchoolBusAPI.ViewModels;
using Microsoft.Extensions.Configuration;
using System.Collections.Specialized;
using System.Net.Http;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

// For more information on enabling MVC for empty projects, visit http://go.microsoft.com/fwlink/?LinkID=397860

namespace SchoolBusAPI
{
    public class CCWTools 
    {
        /// <summary>
        /// Hangfire job to populate CCW data.  Only used for a deploy to PROD with a new database.
        /// </summary>
        /// <param name="connectionString"></param>
        /// <param name="Configuration"></param>
        public static void PopulateCCWJob (string connectionString, string cCW_userId, string cCW_guid, string cCW_directory, string ccwHost)
        {
            // sanity check
            if (connectionString != null && cCW_userId != null && cCW_guid != null && cCW_directory != null && ccwHost != null)
            {

                DbContextOptionsBuilder<DbAppContext> options = new DbContextOptionsBuilder<DbAppContext>();
                options.UseNpgsql(connectionString);
                DbAppContext context = new DbAppContext(null, options.Options);

                // make a database connection and see if there are any records that are missing the CCW link.
                // we restrict the query to records not updated in the last 6 hours so that the batch process does not repeatedly try a failed record. 
                var data = context.SchoolBuss
                    .FirstOrDefault(x => x.CCWDataId == null && x.LastUpdateTimestamp < DateTime.UtcNow.AddHours(-1));

                if (data != null)
                {

                    // get the data for the request from the result of the database query.
                    string regi = data.ICBCRegistrationNumber;
                    string vin = data.VehicleIdentificationNumber;
                    string plate = data.LicencePlateNumber;

                    // Fetch the record.
                    CCWData cCWData = FetchCCW(ccwHost, regi, vin, plate, cCW_userId, cCW_guid, cCW_directory);
                    data.CCWData = cCWData;

                    // ensure that the record is touched in the database
                    data.LastUpdateTimestamp = DateTime.UtcNow;

                    // save changes.
                    context.SchoolBuss.Update(data);
                    context.SaveChanges();
                }
            }                
        }

        /// <summary>
        /// Hangfire job to refresh existing data.
        /// </summary>
        /// <param name="connectionString"></param>
        /// <param name="Configuration"></param>
        public static void UpdateCCWJob(string connectionString, string cCW_userId, string cCW_guid, string cCW_directory, string ccwHost)
        {
            // sanity check
            if (connectionString != null && cCW_userId != null && cCW_guid != null && cCW_directory != null && ccwHost != null)
            {
                // make a database connection and see if there are any records that need to be updated.
                DbContextOptionsBuilder<DbAppContext> options = new DbContextOptionsBuilder<DbAppContext>();
                options.UseNpgsql(connectionString);
                DbAppContext context = new DbAppContext(null, options.Options);

                // first get a few metrics.  we only want to update a max of 1% the database per day.
                int databaseTotal = context.CCWDatas.Count();

                int dailyTotal = context.CCWDatas
                    .Where(x => x.LastUpdateTimestamp < DateTime.UtcNow.AddDays(-1))
                    .Select(x => x)
                    .Count();

                if (databaseTotal > 0 && dailyTotal < databaseTotal / 100)
                {
                    // make a database connection and see if there are any records that are missing the CCW link.                
                    var data = context.CCWDatas
                        .OrderBy(x => x.LastUpdateTimestamp)
                        .FirstOrDefault(x => x.LastUpdateTimestamp < DateTime.UtcNow.AddDays(-1));

                    if (data != null)
                    {

                        // get the data for the request from the result of the database query.
                        string regi = data.ICBCRegistrationNumber;
                        string vin = data.ICBCVehicleIdentificationNumber;
                        // plate is excluded from the batch update because it can be shared.
                        string plate = null;

                        // Fetch the record.
                        CCWData cCWData = FetchCCW(regi, vin, plate, cCW_userId, cCW_guid, cCW_directory, ccwHost);

                        if (cCWData == null) // fetch did not work, but we don't want it to fire again, so update the timestamp.
                        {
                            // ensure that the record is touched in the database
                            data.LastUpdateTimestamp = DateTime.UtcNow;
                            //update records in SchoolBus table
                            bool exists = context.SchoolBuss.Any(x => x.CCWDataId == cCWData.Id);
                            if (exists)
                            {
                                SchoolBus bus = context.SchoolBuss.First(a => a.CCWDataId == cCWData.Id);
                                if (cCWData.ICBCRegistrationNumber != null && bus.ICBCRegistrationNumber != null && !cCWData.ICBCRegistrationNumber.Equals(bus.ICBCRegistrationNumber))
                                {
                                    bus.ICBCRegistrationNumber = cCWData.ICBCRegistrationNumber;
                                }

                                if (cCWData.ICBCVehicleIdentificationNumber != null && bus.VehicleIdentificationNumber !=null && !cCWData.ICBCVehicleIdentificationNumber.Equals(bus.VehicleIdentificationNumber))
                                {
                                    bus.VehicleIdentificationNumber = cCWData.ICBCVehicleIdentificationNumber;
                                }

                                if (cCWData.ICBCLicencePlateNumber != null && bus.LicencePlateNumber != null && !cCWData.ICBCLicencePlateNumber.Equals(bus.LicencePlateNumber))
                                {
                                    bus.LicencePlateNumber = cCWData.ICBCLicencePlateNumber;
                                }

                                context.SchoolBuss.Update(bus);
                            }
                            
                            context.CCWDatas.Update(data);
                            context.SaveChanges();
                            
                        }
                    }
                }
            }                   
        }

        /// <summary>
        /// Fetch CCW data from the microservice
        /// </summary>
        /// <param name="Configuration"></param>
        /// <param name="regi"></param>
        /// <param name="vin"></param>
        /// <param name="plate"></param>
        /// <param name="cCW_userId"></param>
        /// <param name="cCW_guid"></param>
        /// <param name="cCW_directory"></param>
        /// <param name="ccwHost"></param>
        /// <returns></returns>
        public static CCWData FetchCCW(string regi, string vin, string plate, string cCW_userId, string cCW_guid, string cCW_directory, string ccwHost)
        {            
            CCWData result = null;

            Dictionary<string, string> parametersToAdd = new Dictionary<string, string>();
            if (regi != null)
            {
                // first convert the regi to a number.
                int tempRegi;
                bool parsed = int.TryParse(regi, out tempRegi);

                if (parsed)
                {
                    regi = tempRegi.ToString();
                }
                parametersToAdd.Add("regi", regi);
            }
            if (vin != null)
            {
                parametersToAdd.Add("vin", vin);
            }
            if (plate != null)
            {
                parametersToAdd.Add("plate", plate);
            }
            var targetUrl = ccwHost + "/api/CCW/GetCCW";
            string newUri = QueryHelpers.AddQueryString(targetUrl, parametersToAdd);

            // call the microservice
            HttpClient client = new HttpClient();

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, newUri);
                request.Headers.Clear();
                // transfer over the request headers.
                request.Headers.Add("SM_UNIVERSALID", cCW_userId);
                request.Headers.Add("SMGOV_USERGUID", cCW_guid);
                request.Headers.Add("SM_AUTHDIRNAME", cCW_directory);

                Task<HttpResponseMessage> responseTask = client.SendAsync(request);
                responseTask.Wait();

                HttpResponseMessage response = responseTask.Result;
                if (response.StatusCode == HttpStatusCode.OK) // success
                {
                    var stringtask = response.Content.ReadAsStringAsync();
                    stringtask.Wait();
                    // parse as JSON.
                    string jsonString = stringtask.Result;
                    result = JsonConvert.DeserializeObject<CCWData>(jsonString);
                }
            }
            catch (Exception e)
            {
                result = null;
            }

            finally
            {
                if (client != null)
                {
                    try
                    {
                        client.Dispose();
                    }
                    catch (Exception e)
                    {
                        Console.WriteLine(e.ToString());
                    }
                }
            }

            return result;
        }
    }
}
