package com.example.myapp.data.repository

import com.example.myapp.data.model.IpGeoResponse
import com.example.myapp.data.network.IpApiService
import com.example.myapp.domain.repository.GeoRepository

class GeoRepositoryImpl(private val ipApiService: IpApiService) : GeoRepository {
    override suspend fun getGeoInfo(): IpGeoResponse? {
        return ipApiService.getGeoInfo()
    }
}
