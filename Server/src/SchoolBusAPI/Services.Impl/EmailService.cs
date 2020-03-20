﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SchoolBusAPI.Services;
using Microsoft.AspNetCore.Mvc;
using SchoolBusAPI.Models;
using MailKit.Net.Smtp;
using System.Net.Security;
using MimeKit;
using Microsoft.Extensions.Configuration;

namespace SchoolBusAPI.Services.Impl
{
    /// <summary>
    /// 
    /// </summary>
    public class EmailService : IEmailService
    {
        private readonly IConfiguration Configuration;

        /// <summary>
        /// Create a email service
        /// </summary>
        /// <param name="configuration"></param>
        public EmailService(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="email">email object get from front-end</param>
        /// <returns></returns>
        public virtual IActionResult EmailSend(Email email)
        {
            if (email == null)
            {
                return new BadRequestResult();
            }
            else
            {
                char[] delimiterChars= { ' ',',',';' };
                string SMTP_SERVER_SSL_TRUSTED_THUMBPRINT = Configuration["SMTP_SERVER_SSL_TRUSTED_THUMBPRINT"];

                string fromAddressTitle = email.userName.ToString();
                string SmtpServer = Configuration["SMTP_SERVER"];
                int SmtpPort = int.Parse(Configuration["SMTP_PORT"]);

                string emailTo = email.mailTo.ToString();
                string[] emails = emailTo.Split(delimiterChars);
                string mailCc = email.mailCc.ToString();
                string[] ccs = mailCc.Split(delimiterChars);

                string emailFrom = email.mailFrom.ToString();
                string subject = email.subject.ToString();
                string body = email.body.ToString();

                try
                {
                    var emailMessage = new MimeMessage();

                    emailMessage.From.Add(new MailboxAddress(fromAddressTitle, emailFrom)); //add from address
                    foreach (var mailTo in emails)//add to addresses
                    {
                        if (mailTo != string.Empty)
                        {
                            emailMessage.To.Add(new MailboxAddress(mailTo));
                        }
                    }

                    foreach (var cc in ccs)//add ccs
                    {
                        if (cc != string.Empty)
                        {
                            emailMessage.Cc.Add(new MailboxAddress(cc));
                        }
                    }

                    emailMessage.Subject = subject;
                    emailMessage.Body = new TextPart("html") { Text = body };

                    SmtpClient client = new SmtpClient();

                    try
                    {
                        client.ServerCertificateValidationCallback = (sender, certificate, chain, sslPolicyErrors) =>
                        {
                            Console.WriteLine("Starting certificate validation.");
                            if (sslPolicyErrors == SslPolicyErrors.None)
                            {
                                Console.WriteLine("Cerficiate valid");
                                return true;
                            }

                            if (chain.ChainElements == null || chain.ChainElements.Count == 0)
                            {
                                Console.WriteLine("No certificates found in chain.");
                                return false;
                            }

                            Console.WriteLine("SSL Policy errors detected, validating certificate chain");
                            foreach (var chainCertificate in chain.ChainElements)
                            {
                                if (chainCertificate.Certificate == null)
                                {
                                    Console.WriteLine($"No valid certificate found in current element: {chainCertificate.Information}");
                                    continue;
                                }
                                bool trustedCertificate = (chainCertificate.Certificate.Thumbprint == SMTP_SERVER_SSL_TRUSTED_THUMBPRINT);

                                Console.WriteLine($"Certificate Thumbprint ({chainCertificate.Certificate.Thumbprint}) is {(trustedCertificate ? "" : "not")} trusted");
                                if (trustedCertificate) return true;
                            }
                            Console.WriteLine("Unable to validate certificate chain.");
                            return false;
                        };

                        client.CheckCertificateRevocation = false;
                        client.Connect(SmtpServer, SmtpPort, MailKit.Security.SecureSocketOptions.Auto);
                    }
                    catch (MailKit.Security.SslHandshakeException sslException)
                    {
                        email.mailSent = false;
                        email.errorInfo = "Unable to process the SSL Certificate.  Certificate may be untrusted, or the server does not accept SSL.";
                        Console.WriteLine($"Unable to process the SSL Certificate.  Certificate may be untrusted, or the server does not accept SSL.");
                        return new ObjectResult(email);
                    }
                    catch (Exception ex)
                    {
                        email.mailSent = false;
                        email.errorInfo = $"Unknown error occurred: ({ex.GetType().ToString()}) {ex.Message}.";
                        Console.WriteLine($"Unknown error occurred: ({ex.GetType().ToString()}) {ex.Message}");
                        return new ObjectResult(email);
                    }
                    
                    client.Send(emailMessage);
                    Console.WriteLine("Email sent.");
                    client.Disconnect(true);

                    email.mailSent = true;
                    return new ObjectResult(email);
                }
                catch (Exception ex)
                {
                    email.mailSent = false;
                    email.errorInfo = $"Error: {ex.Message}.";
                    return new ObjectResult(email);
                }
            }
        }
    }
}
