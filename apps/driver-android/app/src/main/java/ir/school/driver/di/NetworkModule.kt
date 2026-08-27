package ir.school.driver.di

import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import ir.school.driver.BuildConfig
import ir.school.driver.data.local.AttendanceEventDao
import ir.school.driver.data.local.EncryptedPreferencesManager
import ir.school.driver.data.remote.DriverApiService
import ir.school.driver.data.repository.AttendanceRepositoryImpl
import ir.school.driver.domain.repository.AttendanceRepository
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        return OkHttpClient.Builder()
            .addInterceptor(logging)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideDriverApiService(okHttpClient: OkHttpClient): DriverApiService {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(DriverApiService::class.java)
    }

    @Provides
    @Singleton
    fun provideAttendanceRepository(
        dao: AttendanceEventDao,
        api: DriverApiService,
        prefs: EncryptedPreferencesManager
    ): AttendanceRepository {
        return AttendanceRepositoryImpl(dao, api, prefs)
    }
}
