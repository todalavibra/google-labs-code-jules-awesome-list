package com.example.myapp.data.network

import com.example.myapp.data.model.IpGeoResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.io.IOException

class IpApiServiceImpl : IpApiService {

    private val client = OkHttpClient()
    // Using HTTP for now as specified, but HTTPS is preferred: "https://ip-api.com/json"
    private val apiUrl = "http://ip-api.com/json"

    override suspend fun getGeoInfo(): IpGeoResponse? {
        return withContext(Dispatchers.IO) {
            val request = Request.Builder()
                .url(apiUrl)
                .build()

            try {
                client.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        // Log error or handle specific HTTP error codes
                        System.err.println("API Error: ${response.code} ${response.message}")
                        return@withContext null
                    }

                    val responseBody = response.body?.string()
                    if (responseBody == null) {
                        System.err.println("API Error: Empty response body")
                        return@withContext null
                    }

                    // Manual JSON parsing
                    try {
                        val jsonObject = JSONObject(responseBody)
                        val status = jsonObject.getString("status")
                        val country = jsonObject.optString("country", null)
                        val countryCode = jsonObject.optString("countryCode", null)
                        val message = jsonObject.optString("message", null)

                        IpGeoResponse(
                            status = status,
                            country = country,
                            countryCode = countryCode,
                            message = message
                        )
                    } catch (e: Exception) {
                        System.err.println("JSON Parsing Error: ${e.message}")
                        // Attempt to parse a failure message if status indicates failure
                        try {
                             val jsonObject = JSONObject(responseBody)
                             val status = jsonObject.getString("status")
                             val message = jsonObject.optString("message", "Error parsing response")
                             if ("fail" == status) {
                                 return@withContext IpGeoResponse(status, null, null, message)
                             }
                        } catch (e2: Exception) {
                            // Ignore if this also fails
                        }
                        null
                    }
                }
            } catch (e: IOException) {
                System.err.println("Network Error: ${e.message}")
                null
            }
        }
    }
}
