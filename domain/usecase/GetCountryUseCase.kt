package com.example.myapp.domain.usecase

import com.example.myapp.domain.repository.GeoRepository

class GetCountryUseCase(private val geoRepository: GeoRepository) {
    suspend fun execute(): String? {
        val geoInfo = geoRepository.getGeoInfo()
        // Check status and return countryCode, handle "fail" status or null response
        if (geoInfo != null && "success" == geoInfo.status) {
            return geoInfo.countryCode
        }
        // Log error or specific message if needed
        if (geoInfo != null && "fail" == geoInfo.status) {
            System.err.println("GeoAPI failed: ${geoInfo.message}")
        }
        return null // Or a default/unknown country code
    }
}
