package com.anonymous.mobileexpo.bluetooth

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap

/**
 * Liste les appareils Bluetooth appairés avec vérification explicite des permissions
 * (Android 12+ exige BLUETOOTH_CONNECT pour lire nom / adresse).
 */
class BluetoothBondedModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "BluetoothBondedDevices"

    private fun hasConnectPermission(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            return true
        }
        return ContextCompat.checkSelfPermission(
            reactApplicationContext,
            Manifest.permission.BLUETOOTH_CONNECT
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun getAdapter(): BluetoothAdapter? {
        val manager = reactApplicationContext.getSystemService(BluetoothManager::class.java)
        return manager?.adapter ?: BluetoothAdapter.getDefaultAdapter()
    }

    @ReactMethod
    fun getBondedDevices(promise: Promise) {
        try {
            val adapter = getAdapter()
            if (adapter == null) {
                promise.reject("BT_UNAVAILABLE", "Bluetooth non disponible")
                return
            }
            if (!adapter.isEnabled) {
                promise.reject("BT_DISABLED", "Bluetooth désactivé")
                return
            }
            if (!hasConnectPermission()) {
                promise.reject("NO_PERMISSION", "Permission BLUETOOTH_CONNECT requise")
                return
            }

            val bonded: Set<BluetoothDevice> = adapter.bondedDevices ?: emptySet()
            val array: WritableArray = Arguments.createArray()

            for (device in bonded) {
                val map: WritableMap = Arguments.createMap()
                val address = device.address ?: continue
                val name = try {
                    device.name?.takeIf { it.isNotBlank() } ?: address
                } catch (e: SecurityException) {
                    address
                }
                map.putString("address", address)
                map.putString("id", address)
                map.putString("name", name)
                map.putBoolean("bonded", device.bondState == BluetoothDevice.BOND_BONDED)
                array.pushMap(map)
            }

            promise.resolve(array)
        } catch (e: SecurityException) {
            promise.reject("SECURITY", e.message ?: "Permission Bluetooth refusée")
        } catch (e: Exception) {
            promise.reject("ERROR", e.message ?: "Erreur lecture appareils appairés")
        }
    }
}
