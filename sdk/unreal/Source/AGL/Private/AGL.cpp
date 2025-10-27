// Copyright AGL Team. All Rights Reserved.

#include "AGL.h"

#define LOCTEXT_NAMESPACE "FAGLModule"

void FAGLModule::StartupModule()
{
    // This code will execute after your module is loaded into memory
    UE_LOG(LogTemp, Log, TEXT("AGL Module Started"));
}

void FAGLModule::ShutdownModule()
{
    // This function may be called during shutdown to clean up your module
    UE_LOG(LogTemp, Log, TEXT("AGL Module Shutdown"));
}

#undef LOCTEXT_NAMESPACE

IMPLEMENT_MODULE(FAGLModule, AGL)
