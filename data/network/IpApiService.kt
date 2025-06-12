package com.example.myapp.data.network

import com.example.myapp.data.model.IpGeoResponse

interface IpApiService {
    suspend fun getGeoInfo(): IpGeoResponse?
}
