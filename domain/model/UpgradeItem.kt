package com.example.myapp.domain.model

import androidx.annotation.DrawableRes

data class UpgradeItem(
    val id: String,
    val name: String,
    val description: String,
    @DrawableRes val iconResId: Int, // Placeholder, will use R.drawable later
    val maxLevel: Int,
    var currentLevel: Int = 0,
    val costs: List<Int>, // Cost for level 1, level 2, etc. (index currentLevel for next cost)
    val isUnlockedByAd: Boolean = false,
    var isAdUnlocked: Boolean = false, // Relevant if isUnlockedByAd is true
    var effectValue: Float = 1f // Generic way to represent the upgrade's current effect magnitude
) {
    fun isMaxLevel(): Boolean = currentLevel >= maxLevel
    fun getNextLevelCost(): Int? {
        return if (!isMaxLevel() && costs.size > currentLevel) {
            costs[currentLevel]
        } else {
            null
        }
    }
}
