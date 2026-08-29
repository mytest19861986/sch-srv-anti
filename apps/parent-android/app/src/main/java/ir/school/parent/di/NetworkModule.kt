package ir.school.parent.di

import android.content.Context
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import ir.school.parent.data.ServerConfig
import ir.school.parent.data.local.EncryptedPreferencesManager
import ir.school.parent.data.messaging.TokenManager
import ir.school.parent.data.remote.ParentApiService
import ir.school.parent.data.repository.ParentRepositoryImpl
import ir.school.parent.domain.repository.ParentRepository
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
        android.util.Log.d("ServiceYar", "API Request: ${request.url}")
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
    fun provideParentApiService(
        okHttpClient: OkHttpClient,
        @ApplicationContext context: Context
    ): ParentApiService {
        val initialUrl = ServerConfig.getBaseUrl(context).let {
            if (it.endsWith("/")) it else "$it/"
        }
        return Retrofit.Builder()
            .baseUrl(initialUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ParentApiService::class.java)
    }

    @Provides
    @Singleton
    fun provideParentRepository(
        api: ParentApiService,
        prefs: EncryptedPreferencesManager,
        tokenManager: TokenManager
    ): ParentRepository {
        return ParentRepositoryImpl(api, prefs, tokenManager)
    }
}
