/*
 * REST API Documentation for Schoolbus
 *
 * API Sample
 *
 * OpenAPI spec version: v1
 * 
 * 
 */

using System;
using System.Linq;
using System.IO;
using System.Text;
using System.Collections;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Runtime.Serialization;
using Newtonsoft.Json;

namespace SchoolBusAPI.Models
{
    /// <summary>
    /// 
    /// </summary>
    [DataContract]
    public partial class UserRole :  IEquatable<UserRole>
    {

        /// <summary>
        /// Default constructor, required by entity framework
        /// </summary>
        public UserRole()
        {
            this.Id = 0;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="UserRole" /> class.
        /// </summary>
        /// <param name="Id">Primary Key (required).</param>
        /// <param name="EffectiveDate">EffectiveDate (required).</param>
        /// <param name="ExpiryDate">ExpiryDate.</param>
        /// <param name="User">User.</param>
        /// <param name="Role">Role.</param>
        public UserRole(int Id, DateTime EffectiveDate, DateTime? ExpiryDate = null, User User = null, Role Role = null)
        {
            
            this.Id = Id;            
            
            this.EffectiveDate = EffectiveDate;            
            this.ExpiryDate = ExpiryDate;
            this.User = User;
            this.Role = Role;
            
        }

        /// <summary>
        /// Primary Key
        /// </summary>
        /// <value>Primary Key</value>
        [DataMember(Name="id")]
        [MetaDataExtension (Description = "Primary Key")]        
        public int Id { get; set; }

        /// <summary>
        /// Gets or Sets EffectiveDate
        /// </summary>
        [DataMember(Name="effectiveDate")]
                
        public DateTime EffectiveDate { get; set; }

        /// <summary>
        /// Gets or Sets ExpiryDate
        /// </summary>
        [DataMember(Name="expiryDate")]
                
        public DateTime? ExpiryDate { get; set; }

        /// <summary>
        /// Gets or Sets User
        /// </summary>
        [DataMember(Name="user")]
                
        public User User { get; set; }

        /// <summary>
        /// Gets or Sets Role
        /// </summary>
        [DataMember(Name="role")]
                
        public Role Role { get; set; }


        /// <summary>
        /// Returns the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class UserRole {\n");
            sb.Append("  Id: ").Append(Id).Append("\n");
            sb.Append("  EffectiveDate: ").Append(EffectiveDate).Append("\n");
            sb.Append("  ExpiryDate: ").Append(ExpiryDate).Append("\n");
            sb.Append("  User: ").Append(User).Append("\n");
            sb.Append("  Role: ").Append(Role).Append("\n");
            sb.Append("}\n");
            return sb.ToString();
        }

        /// <summary>
        /// Returns the JSON string presentation of the object
        /// </summary>
        /// <returns>JSON string presentation of the object</returns>
        public string ToJson()
        {
            return JsonConvert.SerializeObject(this, Formatting.Indented);
        }

        /// <summary>
        /// Returns true if objects are equal
        /// </summary>
        /// <param name="obj">Object to be compared</param>
        /// <returns>Boolean</returns>
        public override bool Equals(object obj)
        {
            if (ReferenceEquals(null, obj)) { return false; }
            if (ReferenceEquals(this, obj)) { return true; }
            if (obj.GetType() != GetType()) { return false; }
            return Equals((UserRole)obj);
        }

        /// <summary>
        /// Returns true if UserRole instances are equal
        /// </summary>
        /// <param name="other">Instance of UserRole to be compared</param>
        /// <returns>Boolean</returns>
        public bool Equals(UserRole other)
        {

            if (ReferenceEquals(null, other)) { return false; }
            if (ReferenceEquals(this, other)) { return true; }

            return 
                (
                    this.Id == other.Id ||
                    this.Id != null &&
                    this.Id.Equals(other.Id)
                ) && 
                (
                    this.EffectiveDate == other.EffectiveDate ||
                    this.EffectiveDate != null &&
                    this.EffectiveDate.Equals(other.EffectiveDate)
                ) && 
                (
                    this.ExpiryDate == other.ExpiryDate ||
                    this.ExpiryDate != null &&
                    this.ExpiryDate.Equals(other.ExpiryDate)
                ) && 
                (
                    this.User == other.User ||
                    this.User != null &&
                    this.User.Equals(other.User)
                ) && 
                (
                    this.Role == other.Role ||
                    this.Role != null &&
                    this.Role.Equals(other.Role)
                );
        }

        /// <summary>
        /// Gets the hash code
        /// </summary>
        /// <returns>Hash code</returns>
        public override int GetHashCode()
        {
            // credit: http://stackoverflow.com/a/263416/677735
            unchecked // Overflow is fine, just wrap
            {
                int hash = 41;
                // Suitable nullity checks 
                    if (this.Id != null)
                    { 
                        hash = hash * 59 + this.Id.GetHashCode();
                    }
                    if (this.EffectiveDate != null)
                    { 
                        hash = hash * 59 + this.EffectiveDate.GetHashCode();
                    }
                    if (this.ExpiryDate != null)
                    { 
                        hash = hash * 59 + this.ExpiryDate.GetHashCode();
                    }
                    if (this.User != null)
                    { 
                        hash = hash * 59 + this.User.GetHashCode();
                    }
                    if (this.Role != null)
                    { 
                        hash = hash * 59 + this.Role.GetHashCode();
                    }
                return hash;
            }
        }

        #region Operators

        public static bool operator ==(UserRole left, UserRole right)
        {
            return Equals(left, right);
        }

        public static bool operator !=(UserRole left, UserRole right)
        {
            return !Equals(left, right);
        }

        #endregion Operators

    }
}
