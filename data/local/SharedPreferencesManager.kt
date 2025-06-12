package com.example.myapp.data.local

import android.content.Context
import android.content.SharedPreferences

class SharedPreferencesManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("GamePrefs", Context.MODE_PRIVATE)

    companion object {
        const val LAST_DAILY_REWARD_CLAIM_TIME = "last_daily_reward_claim_time"
        const val CURRENT_COINS = "current_coins"
        // Keys for other data to be persisted later
        const val UNLOCKED_SKIN_IDS = "unlocked_skin_ids"
        const val SELECTED_SKIN_ID = "selected_skin_id"
        const val UPGRADE_LEVEL_PREFIX = "upgrade_level_" // e.g., upgrade_level_faster_blades
        const val BOOSTER_MULTIPLIER = "booster_multiplier"
        const val BOOSTER_END_TIME = "booster_end_time"
    }

    // --- Daily Reward ---
    fun getLastDailyRewardClaimTime(): Long {
        return prefs.getLong(LAST_DAILY_REWARD_CLAIM_TIME, 0L)
    }

    fun saveLastDailyRewardClaimTime(timeMillis: Long) {
        prefs.edit().putLong(LAST_DAILY_REWARD_CLAIM_TIME, timeMillis).apply()
    }

    // --- Coins ---
    fun getCurrentCoins(): Int {
        return prefs.getInt(CURRENT_COINS, 0) // Default to 0 coins
    }

    fun saveCurrentCoins(coins: Int) {
        prefs.edit().putInt(CURRENT_COINS, coins).apply()
    }

    // --- Upgrade Levels ---
    fun getUpgradeLevel(upgradeId: String): Int {
        return prefs.getInt("$UPGRADE_LEVEL_PREFIX$upgradeId", 0)
    }

    fun saveUpgradeLevel(upgradeId: String, level: Int) {
        prefs.edit().putInt("$UPGRADE_LEVEL_PREFIX$upgradeId", level).apply()
    }

    // --- Unlocked Skins ---
    fun getUnlockedSkinIds(): Set<String> {
        return prefs.getStringSet(UNLOCKED_SKIN_IDS, emptySet()) ?: emptySet()
    }

    fun saveUnlockedSkinIds(skinIds: Set<String>) {
        prefs.edit().putStringSet(UNLOCKED_SKIN_IDS, skinIds).apply()
    }

    // --- Selected Skin ---
    fun getSelectedSkinId(): String? {
        return prefs.getString(SELECTED_SKIN_ID, null)
    }

    fun saveSelectedSkinId(skinId: String?) {
        if (skinId == null) {
            prefs.edit().remove(SELECTED_SKIN_ID).apply()
        } else {
            prefs.edit().putString(SELECTED_SKIN_ID, skinId).apply()
        }
    }

    // --- Coin Booster ---
    fun getBoosterMultiplier(): Float {
        return prefs.getFloat(BOOSTER_MULTIPLIER, 1.0f)
    }

    fun saveBoosterMultiplier(multiplier: Float) {
        prefs.edit().putFloat(BOOSTER_MULTIPLIER, multiplier).apply()
    }

    fun getBoosterEndTime(): Long {
        return prefs.getLong(BOOSTER_END_TIME, 0L)
    }

    fun saveBoosterEndTime(endTimeMillis: Long) {
        prefs.edit().putLong(BOOSTER_END_TIME, endTimeMillis).apply()
    }

    fun clearBooster() {
        prefs.edit().remove(BOOSTER_MULTIPLIER).remove(BOOSTER_END_TIME).apply()
    }
}
