package com.example.myapp.domain.repository

import com.example.myapp.data.model.IpGeoResponse

interface GeoRepository {
    suspend fun getGeoInfo(): IpGeoResponse?
}
