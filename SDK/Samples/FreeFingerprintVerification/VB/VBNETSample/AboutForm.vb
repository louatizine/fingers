Imports System.Collections.Generic
Imports System.ComponentModel
Imports System.Data
Imports System.Drawing
Imports System.Text
Imports System.Windows.Forms
Imports System.Reflection
Imports System.Runtime.InteropServices
Imports System.Diagnostics
Imports Microsoft.VisualBasic

Imports Neurotec
Imports Neurotec.Biometrics

Namespace VBNETSample
	Partial Public Class AboutForm
		Inherits Form
		<DllImport("kernel32.dll", CharSet:=CharSet.Auto)> _
		Private Shared Function LoadLibrary(ByVal fileName As String) As System.IntPtr
		End Function

		Public Sub New()
			InitializeComponent()

			lblCopyright1.Text = Application.ProductName + " " + Application.ProductVersion
			lblCopyright2.Text = "Copyright ?? 2008-2023 Neurotechnology"

			Dim OSName As String = System.Environment.OSVersion.Platform.ToString()
			lblOS.Text = OSName + ". Version " + System.Environment.OSVersion.Version.Major.ToString() + "." + System.Environment.OSVersion.Version.Minor.ToString() + " (Build " + System.Environment.OSVersion.Version.Build.ToString() + ")"

			lblServicePack.Text = System.Environment.OSVersion.ServicePack

			componentsListView.BeginUpdate()
			AddComponentInfo(Me.[GetType]())
			componentsListView.Items.Add(New ListViewItem(New String() {"Microsoft .NET Framework", System.Environment.Version.ToString(), Nothing}))
			componentsListView.Items.Add(New ListViewItem(New String() {"    " + System.Environment.OSVersion.VersionString, System.Environment.OSVersion.Version.ToString(), Nothing}))
			AddComponentInfo(GetType(Nffv))
			componentColumnHeader.AutoResize(ColumnHeaderAutoResizeStyle.ColumnContent)
			versionColumnHeader.AutoResize(ColumnHeaderAutoResizeStyle.ColumnContent)
			copyrightColumnHeader.AutoResize(ColumnHeaderAutoResizeStyle.ColumnContent)
			componentsListView.EndUpdate()
		End Sub

		Private Sub AddComponentInfo(ByVal type As System.Type)
			Dim dllName As String = Nothing
			Dim dllNameFieldInfo As FieldInfo = type.GetField("DllName")
			If dllNameFieldInfo IsNot Nothing AndAlso dllNameFieldInfo.FieldType.Equals(GetType(String)) AndAlso dllNameFieldInfo.IsStatic Then
				dllName = DirectCast(dllNameFieldInfo.GetValue(Nothing), String)
			End If

			Dim assembly As Assembly = type.Assembly
			Dim assemblyTitleAttribute As AssemblyTitleAttribute = DirectCast(assembly.GetCustomAttributes(GetType(AssemblyTitleAttribute), False)(0), AssemblyTitleAttribute)
			Dim version As System.Version = assembly.GetName().Version
			Dim assemblyInformationalVersionAttributes As AssemblyInformationalVersionAttribute() = DirectCast(assembly.GetCustomAttributes(GetType(AssemblyInformationalVersionAttribute), False), AssemblyInformationalVersionAttribute())
			Dim assemblyCopyrightAttribute As AssemblyCopyrightAttribute = DirectCast(assembly.GetCustomAttributes(GetType(AssemblyCopyrightAttribute), False)(0), AssemblyCopyrightAttribute)

			Dim dllVersionInfo As FileVersionInfo = Nothing
			If dllName IsNot Nothing Then
				Dim hModule As System.IntPtr = LoadLibrary(dllName)
				dllVersionInfo = FileVersionInfo.GetVersionInfo(dllName)
			End If

			Dim v As String
			If assemblyInformationalVersionAttributes.Length = 0 Then
				v = version.ToString()
			Else
				v = assemblyInformationalVersionAttributes(0).InformationalVersion
			End If

			Dim listViewItem As New ListViewItem(New String() {assemblyTitleAttribute.Title, v, assemblyCopyrightAttribute.Copyright})
			componentsListView.Items.Add(listViewItem)
			If dllVersionInfo IsNot Nothing Then
				componentsListView.Items.Add(New ListViewItem(New String() {"    " + dllVersionInfo.FileDescription, New System.Version(dllVersionInfo.FileMajorPart, dllVersionInfo.FileMinorPart, dllVersionInfo.FileBuildPart, dllVersionInfo.FilePrivatePart).ToString(), Nothing, dllVersionInfo.LegalCopyright}))
			End If
		End Sub
	End Class
End Namespace
