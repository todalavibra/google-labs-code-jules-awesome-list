package com.example.myapp.util

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData

class ConnectivityReceiver : BroadcastReceiver() {

    // Using a companion object LiveData to broadcast network state.
    // This can be observed by Activities or ViewModels.
    // For a more sophisticated app, a dedicated singleton or DI approach for this LiveData might be better.
    companion object {
        private val _networkState = MutableLiveData<Boolean>()
        val networkState: LiveData<Boolean> = _networkState
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null) return

        if (intent?.action == ConnectivityManager.CONNECTIVITY_ACTION) {
            val isConnected = NetworkUtils.isInternetAvailable(context)
            _networkState.postValue(isConnected)
        }
    }
}
