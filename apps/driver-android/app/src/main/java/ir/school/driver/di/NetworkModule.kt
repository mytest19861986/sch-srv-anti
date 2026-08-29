package ir.school.driver.di

import android.content.Context
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import ir.school.driver.data.ServerConfig
import ir.school.driver.data.local.AttendanceEventDao
import ir.school.driver.data.local.EncryptedPreferencesManager
import ir.school.driver.data.remote.DriverApiService
import ir.school.driver.data.repository.AttendanceRepositoryImpl
import ir.school.driver.domain.repository.AttendanceRepository
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

class DynamicHostInterceptor(private val context: Context) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        var request = chain.request()
        val customBaseUrl = ServerConfig.getBaseUrl(context)
        val newHttpUrl = customBaseUrl.toHttpUrlOrNull()
        if (newHttpUrl != null) {
            val newUrl = request.url.newBuilder()
                .scheme(newHttpUrl.scheme)
                .host(newHttpUrl.host)
                .port(newHttpUrl.port)
                .build()
            request = request.newBuilder().url(newUrl).build()
        }
        return chain.proceed(request)
    }
}

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideOkHttpClient(@ApplicationContext context: Context): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        return OkHttpClient.Builder()
            .addInterceptor(DynamicHostInterceptor(context))
            .addInterceptor(logging)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideDriverApiService(
        okHttpClient: OkHttpClient,
        @ApplicationContext context: Context
    ): DriverApiService {
        val initialUrl = ServerConfig.getBaseUrl(context).let {
            if (it.endsWith("/")) it else "$it/"
        }
        return Retrofit.Builder()
            .baseUrl(initialUrl)
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
