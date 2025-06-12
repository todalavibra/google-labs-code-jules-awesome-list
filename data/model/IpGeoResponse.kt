package com.example.myapp.data.model

// Using manual JSON parsing, so no need for @SerializedName for now.
// If using Gson/Moshi later, uncomment and use them.

data class IpGeoResponse(
    val status: String,          // e.g., "success", "fail"
    val country: String?,        // e.g., "Canada"
    val countryCode: String?,    // e.g., "CA"
    val message: String?         // Only present on failure, e.g., "private range" or "invalid query"
    // Other fields from ip-api.com like query, regionName, city, lat, lon, etc., can be added if needed.
)
