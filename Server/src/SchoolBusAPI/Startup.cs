/*
 * REST API Documentation for Schoolbus
 *
 * API Sample
 *
 * OpenAPI spec version: v1
 * 
 * 
 */

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Serialization;
using SchoolBusAPI.Authentication;
using SchoolBusAPI.Authorization;
using SchoolBusAPI.Models;
using Swashbuckle.Swagger.Model;
using Swashbuckle.SwaggerGen.Annotations;
using System;
using System.IO;
using System.Text;
using System.Xml.XPath;

namespace SchoolBusAPI
{
    /// <summary>
    /// The application Startup class
    /// </summary>
    public class Startup
    {
        private readonly IHostingEnvironment _hostingEnv;

        public IConfigurationRoot Configuration { get; }

        public Startup(IHostingEnvironment env)
        {
            _hostingEnv = env;

            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
                .AddEnvironmentVariables();

            Configuration = builder.Build();
        }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddAuthorization();
            services.RegisterPermissionHandler();
            services.AddSingleton<IDbAppContextFactory, DbAppContextFactory>(CreateDbAppContextFactory);
            services.AddSingleton<IConfiguration>(Configuration);

            // Add database context
            // - Pattern should be using Configuration.GetConnectionString("Schoolbus") directly; see GetConnectionString for more details.
            services.AddDbContext<DbAppContext>(options => options.UseNpgsql(GetConnectionString()));

            // Add framework services.
            services.AddMvc(options => options.AddDefaultAuthorizationPolicyFilter())
                .AddJsonOptions(
                    opts => {
                        opts.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
                        opts.SerializerSettings.Formatting = Newtonsoft.Json.Formatting.Indented;
                        // ReferenceLoopHandling is set to Ignore to prevent JSON parser issues with the user / roles model.
                        opts.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
                    });

            // Configure Swagger
            services.AddSwaggerGen();
            services.ConfigureSwaggerGen(options =>
            {
                options.SingleApiVersion(new Info
                {
                    Version = "v1",
                    Title = "SchoolBusAPI",
                    Description = "SchoolBusAPI (ASP.NET Core 1.0.1)"
                });

                options.DescribeAllEnumsAsStrings();

                // The swagger API documentation pages look far better with code documentation
                // as input, but we need to protect the application from crashing on startup
                // if the code documetation does not get generated for some reason.
                string codeDocPath = $"{AppContext.BaseDirectory}{Path.DirectorySeparatorChar}{_hostingEnv.ApplicationName}.xml";
                if (File.Exists(codeDocPath))
                {
                    var comments = new XPathDocument(codeDocPath);
                    options.OperationFilter<XmlCommentsOperationFilter>(comments);
                    options.ModelFilter<XmlCommentsModelFilter>(comments);
                }
            });

            // Add application services.
            services.RegisterApplicationServices();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            loggerFactory.AddConsole(Configuration.GetSection("Logging"));
            loggerFactory.AddDebug();

            TryMigrateDatabase(app, loggerFactory);
            app.UseAuthentication(env);

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseMvc();
            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.UseSwagger();
            app.UseSwaggerUi();
        }

        // TODO:
        // - Should database migration be done here; in Startup?
        private void TryMigrateDatabase(IApplicationBuilder app, ILoggerFactory loggerFactory)
        {
            ILogger log = loggerFactory.CreateLogger(typeof(Startup));
            log.LogInformation("Attempting to migrate the database ...");

            try
            {
                using (var serviceScope = app.ApplicationServices.GetRequiredService<IServiceScopeFactory>().CreateScope())
                {
                    log.LogInformation("Fetching the application's database context ...");
                    DbContext context = serviceScope.ServiceProvider.GetService<DbAppContext>();

                    log.LogInformation("Migrating the database ...");
                    context.Database.Migrate();
                    log.LogInformation("The database migration complete.");

                    log.LogInformation("Updating the databse documentation ...");
                    DbCommentsUpdater<DbAppContext> updater = new DbCommentsUpdater<DbAppContext>((DbAppContext)context);
                    updater.UpdateDatabaseDescriptions();
                    log.LogInformation("The database documentation has been updated.");

                    log.LogInformation("Adding/Updating seed data ...");
                    Seeders.SeedFactory<DbAppContext> seederFactory = new Seeders.SeedFactory<DbAppContext>(Configuration, _hostingEnv, loggerFactory);
                    seederFactory.Seed(context as DbAppContext);
                    log.LogInformation("Seeding operations are complete.");
                }

                log.LogInformation("All database migration activities are complete.");
            }
            catch (Exception e)
            {
                StringBuilder msg = new StringBuilder();
                msg.AppendLine("The database migration failed!");
                msg.AppendLine("The database may not be available and the application will not function as expected.");
                msg.AppendLine("Please ensure a database is available and the connection string is correct.");
                msg.AppendLine("If you are running in a development environment, ensure your test database and server configuraiotn match the project's default connection string.");

                log.LogCritical(new EventId(-1, "Database Migration Failed"), e, msg.ToString());
            }
        }

        // ToDo:
        // - Replace the individual environment variables with one that naturally works with the configuration provider and how connection strings work.
        // -- For instance:
        // --- ConnectionStrings:Schoolbus or ConnectionStrings__Schoolbus
        // -- This way the configuration provider is performing all of the lifting and the connection string can be retrieved in a single consistent manner.
        private string GetConnectionString()
        {
            string connectionString = string.Empty;

            string host = Configuration["DATABASE_SERVICE_NAME"];
            string username = Configuration["POSTGRESQL_USER"];
            string password = Configuration["POSTGRESQL_PASSWORD"];
            string database = Configuration["POSTGRESQL_DATABASE"];

            if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password) || string.IsNullOrEmpty(database))
            {
                // When things get cleaned up properly, this is the only call we'll have to make.
                connectionString = Configuration.GetConnectionString("Schoolbus");
            }
            else
            {
                // Environment variables override all other settings; same behaviour as the configuration provider when things get cleaned up. 
                connectionString = $"Host={host};Username={username};Password={password};Database={database};";
            }

            return connectionString;
        }

        private DbAppContextFactory CreateDbAppContextFactory(IServiceProvider serviceProvider)
        {
            DbContextOptionsBuilder<DbAppContext> options = new DbContextOptionsBuilder<DbAppContext>();
            options.UseNpgsql(GetConnectionString());
            DbAppContextFactory dbAppContextFactory = new DbAppContextFactory(options.Options);
            return dbAppContextFactory;
        }
    }
}
